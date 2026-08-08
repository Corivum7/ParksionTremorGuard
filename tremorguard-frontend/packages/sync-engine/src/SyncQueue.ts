import type { SyncItem, SyncPriority, SyncOperation, SyncItemStatus } from './types'
import { PRIORITY_ORDER, DEFAULT_SYNC_CONFIG } from './types'
import { generateId } from '@tremorguard/utils'

export class SyncQueue {
  private items = new Map<string, SyncItem>()
  private maxRetries: number
  private initialBackoffMs: number
  private maxBackoffMs: number

  constructor(options?: {
    maxRetries?: number
    initialBackoffMs?: number
    maxBackoffMs?: number
  }) {
    this.maxRetries = options?.maxRetries ?? DEFAULT_SYNC_CONFIG.maxRetries
    this.initialBackoffMs = options?.initialBackoffMs ?? DEFAULT_SYNC_CONFIG.initialBackoffMs
    this.maxBackoffMs = options?.maxBackoffMs ?? DEFAULT_SYNC_CONFIG.maxBackoffMs
  }

  enqueue(params: {
    entityType: string
    entityId: string
    operation: SyncOperation
    priority?: SyncPriority
    payload?: unknown
  }): string {
    const id = generateId('sync')
    const now = Date.now()
    const priority = params.priority || 'normal'

    const item: SyncItem = {
      id,
      entityType: params.entityType,
      entityId: params.entityId,
      operation: params.operation,
      priority,
      status: 'pending',
      payload: params.payload,
      retryCount: 0,
      maxRetries: this.maxRetries,
      createdAt: now,
      updatedAt: now,
      nextAttemptAt: now,
    }

    this.items.set(id, item)
    return id
  }

  dequeue(batchSize: number): SyncItem[] {
    const now = Date.now()
    const pending = Array.from(this.items.values())
      .filter((item) => item.status === 'pending' && item.nextAttemptAt <= now)
      .sort((a, b) => {
        const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        if (priorityDiff !== 0) return priorityDiff
        return a.createdAt - b.createdAt
      })
      .slice(0, batchSize)

    for (const item of pending) {
      item.status = 'processing'
      item.updatedAt = now
    }

    return pending
  }

  markSuccess(id: string): void {
    const item = this.items.get(id)
    if (!item) return
    item.status = 'completed'
    item.updatedAt = Date.now()
  }

  markFailed(id: string, error: string): void {
    const item = this.items.get(id)
    if (!item) return

    item.retryCount++
    item.lastError = error
    item.updatedAt = Date.now()

    if (item.retryCount >= item.maxRetries) {
      item.status = 'failed'
    } else {
      item.status = 'pending'
      const backoff = Math.min(
        this.initialBackoffMs * Math.pow(2, item.retryCount - 1),
        this.maxBackoffMs,
      )
      item.nextAttemptAt = Date.now() + backoff
    }
  }

  retryFailed(entityType?: string): number {
    let count = 0
    const now = Date.now()
    for (const item of this.items.values()) {
      if (item.status === 'failed' && (!entityType || item.entityType === entityType)) {
        item.status = 'pending'
        item.retryCount = 0
        item.nextAttemptAt = now
        item.updatedAt = now
        count++
      }
    }
    return count
  }

  clearCompleted(entityType?: string): number {
    let count = 0
    for (const [id, item] of this.items.entries()) {
      if (item.status === 'completed' && (!entityType || item.entityType === entityType)) {
        this.items.delete(id)
        count++
      }
    }
    return count
  }

  clearFailed(entityType?: string): number {
    let count = 0
    for (const [id, item] of this.items.entries()) {
      if (item.status === 'failed' && (!entityType || item.entityType === entityType)) {
        this.items.delete(id)
        count++
      }
    }
    return count
  }

  getPendingItems(entityType?: string): SyncItem[] {
    return Array.from(this.items.values())
      .filter((item) => !entityType || item.entityType === entityType)
      .filter((item) => item.status === 'pending')
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  }

  getFailedItems(entityType?: string): SyncItem[] {
    return Array.from(this.items.values()).filter(
      (item) => item.status === 'failed' && (!entityType || item.entityType === entityType),
    )
  }

  getStats(): {
    pendingCount: number
    processingCount: number
    failedCount: number
    completedCount: number
  } {
    let pendingCount = 0
    let processingCount = 0
    let failedCount = 0
    let completedCount = 0

    for (const item of this.items.values()) {
      switch (item.status) {
        case 'pending':
          pendingCount++
          break
        case 'processing':
          processingCount++
          break
        case 'failed':
          failedCount++
          break
        case 'completed':
          completedCount++
          break
      }
    }

    return { pendingCount, processingCount, failedCount, completedCount }
  }

  size(): number {
    return this.items.size
  }

  has(itemId: string): boolean {
    return this.items.has(itemId)
  }

  get(itemId: string): SyncItem | undefined {
    return this.items.get(itemId)
  }

  remove(itemId: string): boolean {
    return this.items.delete(itemId)
  }

  clear(): void {
    this.items.clear()
  }

  toArray(): SyncItem[] {
    return Array.from(this.items.values())
  }

  load(items: SyncItem[]): void {
    this.items.clear()
    for (const item of items) {
      this.items.set(item.id, item)
    }
  }

  findByEntity(entityType: string, entityId: string): SyncItem | undefined {
    for (const item of this.items.values()) {
      if (item.entityType === entityType && item.entityId === entityId) {
      return item
    }
    }
    return undefined
  }
}
