export interface RunResult {
  changes: number
  lastInsertRowId: number
}

export interface DatabaseOptions {
  name: string
  location?: string
  enableWAL?: boolean
  enableForeignKeys?: boolean
}

export type SyncStatus = 'synced' | 'pending' | 'conflict'

export interface Migration {
  version: number
  name: string
  up: string[]
  down?: string[]
}

export interface BaseEntity {
  id: string
  clientId: string
  serverId?: string
  createdAt: number
  updatedAt: number
  syncStatus: SyncStatus
}

export interface Repository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>
  findByClientId(clientId: string): Promise<T | null>
  findAll(limit?: number, offset?: number): Promise<T[]>
  count(): Promise<number>
  insert(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & Partial<T>): Promise<T>
  update(id: string, updates: Partial<T>): Promise<T | null>
  delete(id: string): Promise<boolean>
  findPendingSync(): Promise<T[]>
  markSynced(id: string, serverId: string): Promise<boolean>
  markConflict(id: string): Promise<boolean>
}
