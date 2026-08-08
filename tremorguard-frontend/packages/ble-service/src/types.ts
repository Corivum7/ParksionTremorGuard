export interface BleDevice {
  id: string
  name: string
  rssi: number
  isConnectable: boolean
  serviceUUIDs: string[]
  manufacturerData?: ArrayBuffer
  localName?: string
}

export interface BleServiceInfo {
  uuid: string
  isPrimary: boolean
  characteristics: BleCharacteristicInfo[]
}

export interface BleCharacteristicInfo {
  uuid: string
  isReadable: boolean
  isWritable: boolean
  isNotifiable: boolean
  isIndicatable: boolean
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'disconnecting'

export interface BleError {
  code: BleErrorCode
  message: string
  deviceId?: string
  cause?: unknown
}

export enum BleErrorCode {
  SCAN_FAILED = 'SCAN_FAILED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  DISCONNECTION_FAILED = 'DISCONNECTION_FAILED',
  READ_FAILED = 'READ_FAILED',
  WRITE_FAILED = 'WRITE_FAILED',
  SUBSCRIBE_FAILED = 'SUBSCRIBE_FAILED',
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  SERVICE_NOT_FOUND = 'SERVICE_NOT_FOUND',
  CHARACTERISTIC_NOT_FOUND = 'CHARACTERISTIC_NOT_FOUND',
  OPERATION_TIMED_OUT = 'OPERATION_TIMED_OUT',
  BLUETOOTH_UNAVAILABLE = 'BLUETOOTH_UNAVAILABLE',
}

export interface ScanOptions {
  serviceUUIDs?: string[]
  durationMs?: number
  allowDuplicates?: boolean
}

export interface WriteOptions {
  withResponse?: boolean
}

export interface HeartbeatConfig {
  intervalMs: number
  timeoutMs: number
  maxRetries: number
  maxBackoffMs: number
}

export const DEFAULT_HEARTBEAT_CONFIG: HeartbeatConfig = {
  intervalMs: 5000,
  timeoutMs: 10000,
  maxRetries: 10,
  maxBackoffMs: 60000,
}
