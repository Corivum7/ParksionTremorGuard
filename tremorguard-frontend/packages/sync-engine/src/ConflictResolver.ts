import { createLogger } from '@tremorguard/utils'

const logger = createLogger('sync-conflict')

export type ConflictResolutionStrategy =
  | 'last-write-wins'
  | 'client-wins'
  | 'server-wins'
  | 'manual'
  | 'merge'

export interface ConflictItem<T = {
  entityType: string
  entityId: string
  clientVersion: T
  serverVersion: T
  clientUpdatedAt: number
  serverUpdatedAt: number
}

export interface ConflictResolution<T> {
  strategy: ConflictResolutionStrategy
  resolved: boolean
  resolvedVersion?: T
  needsManualReview: boolean
}

export class ConflictResolver {
  private defaultStrategy: ConflictResolutionStrategy
  private entityStrategies = new Map<string, ConflictResolutionStrategy>()
  private manualReviewCallbacks = new Set<(conflict: ConflictItem<unknown>) => void>()

  constructor(defaultStrategy: ConflictResolutionStrategy = 'last-write-wins') {
    this.defaultStrategy = defaultStrategy
  }

  setDefaultStrategy(strategy: ConflictResolutionStrategy): void {
    this.defaultStrategy = strategy
  }

  setEntityStrategy(entityType: string, strategy: ConflictResolutionStrategy): void {
    this.entityStrategies.set(entityType, strategy)
  }

  getStrategy(entityType: string): ConflictResolutionStrategy {
    return this.entityStrategies.get(entityType) || this.defaultStrategy
  }

  resolve<T extends { updatedAt?: number }>(conflict: ConflictItem<T>): ConflictResolution<T> {
    const strategy = this.getStrategy(conflict.entityType)
    logger.info(`Resolving conflict for ${conflict.entityType}/${conflict.entityId} using ${strategy}`)

    switch (strategy) {
      case 'last-write-wins':
        return this.resolveLastWriteWins(conflict)
      case 'client-wins':
        return {
          strategy: 'client-wins',
          resolved: true,
          resolvedVersion: conflict.clientVersion,
          needsManualReview: false,
        }
      case 'server-wins':
        return {
          strategy: 'server-wins',
          resolved: true,
          resolvedVersion: conflict.serverVersion,
          needsManualReview: false,
        }
      case 'merge':
        return this.resolveMerge(conflict)
      case 'manual':
      default:
        return {
          strategy: 'manual',
          resolved: false,
          needsManualReview: true,
        }
    }
  }

  private resolveLastWriteWins<T extends { updatedAt?: number }>(
    conflict: ConflictItem<T>): ConflictResolution<T> {
    const clientTime = conflict.clientUpdatedAt
    const serverTime = conflict.serverUpdatedAt

    if (clientTime >= serverTime) {
      logger.debug('Client version is newer, client wins')
      return {
        strategy: 'last-write-wins',
        resolved: true,
        resolvedVersion: conflict.clientVersion,
        needsManualReview: false,
      }
    } else {
      logger.debug('Server version is newer, server wins')
      return {
        strategy: 'last-write-wins',
        resolved: true,
        resolvedVersion: conflict.serverVersion,
        needsManualReview: false,
      }
    }
  }

  private resolveMerge<T extends Record<string, unknown>>(
    conflict: ConflictItem<T>): ConflictResolution<T> {
    try {
      const client = conflict.clientVersion as Record<string, unknown>
      const server = conflict.serverVersion as Record<string, unknown>
      const merged: Record<string, unknown> = { ...server }

      for (const [key, value] of Object.entries(client)) {
        if (!(key in server)) {
          merged[key] = value
        } else if (typeof value === 'object' && value !== null && typeof server[key] === 'object' && server[key] !== null) {
          merged[key] = this.deepMerge(value as Record<string, unknown>, server[key] as Record<string, unknown>)
        }
      }

      merged.updatedAt = Math.max(conflict.clientUpdatedAt, conflict.serverUpdatedAt)

      return {
        strategy: 'merge',
        resolved: true,
        resolvedVersion: merged as T,
        needsManualReview: false,
      }
    } catch (error) {
      logger.warn('Merge failed, falling back to manual review', error)
      return {
        strategy: 'merge',
        resolved: false,
        needsManualReview: true,
      }
    }
  }

  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
  ): Record<string, unknown> {
    const result = { ...source }
    for (const [key, value] of Object.entries(target)) {
      if (!(key in result)) {
        result[key] = value
      } else if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        typeof result[key] === 'object' &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        result[key] = this.deepMerge(
          value as Record<string, unknown>,
          result[key] as Record<string, unknown>,
        )
      }
    }
    return result
  }

  onManualReviewRequired(callback: (conflict: ConflictItem<unknown>) => void): () => void {
    this.manualReviewCallbacks.add(callback)
    return () => this.manualReviewCallbacks.delete(callback)
  }

  triggerManualReview(conflict: ConflictItem<unknown>): void {
    logger.warn(`Manual review required for ${conflict.entityType}/${conflict.entityId}`)
    this.manualReviewCallbacks.forEach((cb) => cb(conflict))
  }
}
