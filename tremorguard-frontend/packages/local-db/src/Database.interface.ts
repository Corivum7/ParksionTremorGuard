import type { RunResult, DatabaseOptions, Migration } from './types'

export interface Database {
  open(options: DatabaseOptions): Promise<void>
  close(): Promise<void>
  isOpen(): boolean

  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>
  queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null>
  run(sql: string, params?: unknown[]): Promise<RunResult>

  transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>
  executeBatch(statements: Array<{ sql: string; params?: unknown[] }>): Promise<void>

  migrate(migrations: Migration[]): Promise<number>
  getMigrationVersion(): Promise<number>

  onError(callback: (error: Error) => void): () => void
}

export interface Transaction {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>
  queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null>
  run(sql: string, params?: unknown[]): Promise<RunResult>
}
