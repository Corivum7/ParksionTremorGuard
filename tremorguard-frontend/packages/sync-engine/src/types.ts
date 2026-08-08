export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline'

export type SyncOperation = 'create' | 'update' | 'delete'

export type SyncPriority = 'critical' | 'high' | 'normal' | 'low'

export type SyncItemStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface SyncItem {
  id: string
  entityType: string
  entityId: string
  operation: SyncOperation
  priority: SyncPriority
  status: SyncItemStatus
  payload?: unknown
  retryCount: number
  maxRetries: number
  createdAt: number
  updatedAt: number
  lastError?: string
  nextAttemptAt: number
}

export interface SyncResult {
  success: boolean
  totalItems: number
  successItems: number
  failedItems: number
  startedAt: number
  finishedAt: number
  errors: Array<{
    itemId: string
    entityType: string
    operation: SyncOperation
    error: string
  }>
}

export interface SyncStats {
  pendingCount: number
  processingCount: number
  failedCount: number
  completedCount: number
  lastSyncAt?: number
  lastSuccessfulSyncAt?: number
  totalSynced: number
}

export interface SyncEngineConfig {
  autoSyncIntervalMs: number
  maxConcurrentSyncItems: number
  maxRetries: number
  initialBackoffMs: number
  maxBackoffMs: number
  batchSize: number
}

export const DEFAULT_SYNC_CONFIG: SyncEngineConfig = {
  autoSyncIntervalMs: 30000,
  maxConcurrentSyncItems: 5,
  maxRetries: 10,
  initialBackoffMs: 1000,
  maxBackoffMs: 300000,
  batchSize: 20,
}

export const PRIORITY_ORDER: Record<SyncPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
}
