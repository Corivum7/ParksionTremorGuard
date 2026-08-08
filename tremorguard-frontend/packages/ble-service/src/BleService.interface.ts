import type {
  BleDevice,
  BleServiceInfo,
  BleError,
  ConnectionState,
  ScanOptions,
  WriteOptions,
} from './types'

export interface BleService {
  isAvailable(): Promise<boolean>
  requestPermissions(): Promise<boolean>
  enable(): Promise<boolean>

  scan(options?: ScanOptions): Promise<BleDevice[]>
  stopScan(): Promise<void>
  onDeviceDiscovered(callback: (device: BleDevice) => void): () => void

  connect(deviceId: string): Promise<void>
  disconnect(deviceId: string): Promise<void>
  isConnected(deviceId: string): boolean
  getConnectionState(deviceId: string): ConnectionState
  onConnectionChange(callback: (deviceId: string, state: ConnectionState) => void): () => void

  discoverServices(deviceId: string): Promise<BleServiceInfo[]>
  read(deviceId: string, serviceUUID: string, characteristicUUID: string): Promise<DataView>
  write(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    data: ArrayBuffer,
    options?: WriteOptions,
  ): Promise<void>
  subscribe(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    callback: (data: DataView) => void,
  ): Promise<() => void>

  onError(callback: (error: BleError) => void): () => void

  startHeartbeat(deviceId: string): void
  stopHeartbeat(deviceId: string): void
  onHeartbeatFailure(callback: (deviceId: string) => void): () => void
}
