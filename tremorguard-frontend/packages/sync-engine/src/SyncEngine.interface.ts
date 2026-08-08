import type {
  SyncStatus,
  SyncItem,
  SyncResult,
  SyncStats,
  SyncEngineConfig,
  SyncOperation,
  SyncPriority,
} from './types'

export interface SyncEngine {
  start(): Promise<void>
  stop(): Promise<void>
  isRunning(): boolean

  enqueue(params: {
    entityType: string
    entityId: string
    operation: SyncOperation
    priority?: SyncPriority
    payload?: unknown
  }): Promise<string>

  syncNow(): Promise<SyncResult>

  getStatus(): SyncStatus
  getStats(): Promise<SyncStats>
  getConfig(): SyncEngineConfig
  updateConfig(config: Partial<SyncEngineConfig>): void

  onStatusChange(callback: (status: SyncStatus) => void): () => void
  onSyncComplete(callback: (result: SyncResult) => void): () => void
  onSyncError(callback: (error: Error, item?: SyncItem) => void): () => void

  getPendingItems(entityType?: string): Promise<SyncItem[]>
  clearFailedItems(entityType?: string): Promise<number>
  retryFailedItems(entityType?: string): Promise<number>
}

export interface SyncAdapter {
  push(entityType: string, operation: SyncOperation, payload: unknown): Promise<unknown>
  pull(entityType: string, since?: number): Promise<Array<{ operation: SyncOperation; payload: unknown }>>
  isOnline(): boolean
  onConnectivityChange(callback: (online: boolean) => void): () => void
}
