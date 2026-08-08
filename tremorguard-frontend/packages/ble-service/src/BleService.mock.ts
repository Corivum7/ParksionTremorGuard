import type { BleService } from './BleService.interface'
import type {
  BleDevice,
  BleServiceInfo,
  BleError,
  ConnectionState,
  ScanOptions,
  WriteOptions,
} from './types'
import { BleErrorCode } from './types'
import { BLE_UUIDS } from '@tremorguard/shared-types'
import { createLogger } from '@tremorguard/utils'

const logger = createLogger('ble-mock')

interface MockSubscription {
  deviceId: string
  serviceUUID: string
  characteristicUUID: string
  callback: (data: DataView) => void
  intervalId?: ReturnType<typeof setInterval>
}

export class MockBleService implements BleService {
  private connectedDevices = new Map<string, ConnectionState>()
  private deviceDiscoveredCallbacks = new Set<(device: BleDevice) => void>()
  private connectionChangeCallbacks = new Set<(deviceId: string, state: ConnectionState) => void>()
  private errorCallbacks = new Set<(error: BleError) => void>()
  private heartbeatFailureCallbacks = new Set<(deviceId: string) => void>()
  private subscriptions = new Set<MockSubscription>()
  private mockDevices: BleDevice[] = [
    {
      id: 'mock-device-001',
      name: 'TremorGuard-W1',
      rssi: -45,
      isConnectable: true,
      serviceUUIDs: [
        BLE_UUIDS.services.tremorService,
        BLE_UUIDS.services.deviceInfoService,
        BLE_UUIDS.services.batteryService,
      ],
      localName: 'TremorGuard-W1',
    },
    {
      id: 'mock-device-002',
      name: 'TremorGuard-W2',
      rssi: -62,
      isConnectable: true,
      serviceUUIDs: [
        BLE_UUIDS.services.tremorService,
        BLE_UUIDS.services.deviceInfoService,
        BLE_UUIDS.services.batteryService,
      ],
      localName: 'TremorGuard-W2',
    },
  ]

  private simulatedHeartbeatTimers = new Map<string, ReturnType<typeof setInterval>>()

  async isAvailable(): Promise<boolean> {
    logger.debug('Mock: isAvailable -> true')
    return true
  }

  async requestPermissions(): Promise<boolean> {
    logger.debug('Mock: requestPermissions -> true')
    return true
  }

  async enable(): Promise<boolean> {
    logger.debug('Mock: enable -> true')
    return true
  }

  async scan(options?: ScanOptions): Promise<BleDevice[]> {
    const { durationMs = 3000, serviceUUIDs } = options || {}
    logger.debug(`Mock: scan started, duration=${durationMs}ms`)

    const filtered = serviceUUIDs?.length
      ? this.mockDevices.filter((d) => d.serviceUUIDs.some((u) => serviceUUIDs.includes(u)))
      : this.mockDevices

    filtered.forEach((device) => {
      setTimeout(() => {
        this.deviceDiscoveredCallbacks.forEach((cb) => cb(device))
      }, Math.random() * durationMs)
    })

    return new Promise((resolve) => {
      setTimeout(() => {
        logger.debug(`Mock: scan completed, found ${filtered.length} devices`)
        resolve(filtered)
      }, durationMs)
    })
  }

  async stopScan(): Promise<void> {
    logger.debug('Mock: stopScan')
  }

  onDeviceDiscovered(callback: (device: BleDevice) => void): () => void {
    this.deviceDiscoveredCallbacks.add(callback)
    return () => this.deviceDiscoveredCallbacks.delete(callback)
  }

  async connect(deviceId: string): Promise<void> {
    const device = this.mockDevices.find((d) => d.id === deviceId)
    if (!device) {
      const error: BleError = {
        code: BleErrorCode.DEVICE_NOT_FOUND,
        message: `Device ${deviceId} not found`,
        deviceId,
      }
      this.errorCallbacks.forEach((cb) => cb(error))
      throw error
    }

    logger.debug(`Mock: connecting to ${device.name}`)
    this.connectedDevices.set(deviceId, 'connecting')
    this.connectionChangeCallbacks.forEach((cb) => cb(deviceId, 'connecting'))

    await this.delay(500 + Math.random() * 500)

    this.connectedDevices.set(deviceId, 'connected')
    this.connectionChangeCallbacks.forEach((cb) => cb(deviceId, 'connected'))
    logger.info(`Mock: connected to ${device.name}`)
  }

  async disconnect(deviceId: string): Promise<void> {
    logger.debug(`Mock: disconnecting ${deviceId}`)
    this.connectedDevices.set(deviceId, 'disconnecting')
    this.connectionChangeCallbacks.forEach((cb) => cb(deviceId, 'disconnecting'))

    this.stopHeartbeat(deviceId)

    await this.delay(200)

    this.connectedDevices.set(deviceId, 'disconnected')
    this.connectionChangeCallbacks.forEach((cb) => cb(deviceId, 'disconnected'))
    logger.info(`Mock: disconnected ${deviceId}`)
  }

  isConnected(deviceId: string): boolean {
    return this.connectedDevices.get(deviceId) === 'connected'
  }

  getConnectionState(deviceId: string): ConnectionState {
    return this.connectedDevices.get(deviceId) || 'disconnected'
  }

  onConnectionChange(callback: (deviceId: string, state: ConnectionState) => void): () => void {
    this.connectionChangeCallbacks.add(callback)
    return () => this.connectionChangeCallbacks.delete(callback)
  }

  async discoverServices(deviceId: string): Promise<BleServiceInfo[]> {
    if (!this.isConnected(deviceId)) {
      throw { code: BleErrorCode.DEVICE_NOT_FOUND, message: 'Not connected', deviceId }
    }

    logger.debug(`Mock: discoverServices for ${deviceId}`)
    return [
      {
        uuid: BLE_UUIDS.services.tremorService,
        isPrimary: true,
        characteristics: [
          {
            uuid: BLE_UUIDS.characteristics.tremorData,
            isReadable: false,
            isWritable: true,
            isNotifiable: true,
            isIndicatable: false,
          },
          {
            uuid: BLE_UUIDS.characteristics.tremorConfig,
            isReadable: true,
            isWritable: true,
            isNotifiable: false,
            isIndicatable: false,
          },
          {
            uuid: BLE_UUIDS.characteristics.heartbeat,
            isReadable: true,
            isWritable: false,
            isNotifiable: true,
            isIndicatable: false,
          },
        ],
      },
      {
        uuid: BLE_UUIDS.services.deviceInfoService,
        isPrimary: true,
        characteristics: [
          {
            uuid: BLE_UUIDS.characteristics.deviceInfo,
            isReadable: true,
            isWritable: false,
            isNotifiable: false,
            isIndicatable: false,
          },
        ],
      },
      {
        uuid: BLE_UUIDS.services.batteryService,
        isPrimary: true,
        characteristics: [
          {
            uuid: BLE_UUIDS.characteristics.batteryLevel,
            isReadable: true,
            isWritable: false,
            isNotifiable: true,
            isIndicatable: false,
          },
        ],
      },
    ]
  }

  async read(deviceId: string, serviceUUID: string, characteristicUUID: string): Promise<DataView> {
    if (!this.isConnected(deviceId)) {
      throw { code: BleErrorCode.DEVICE_NOT_FOUND, message: 'Not connected', deviceId }
    }

    logger.debug(`Mock: read ${characteristicUUID}`)
    await this.delay(5 + Math.random() * 5)

    if (characteristicUUID === BLE_UUIDS.characteristics.batteryLevel) {
      const buffer = new ArrayBuffer(1)
      new DataView(buffer).setUint8(0, 85)
      return new DataView(buffer)
    }

    if (characteristicUUID === BLE_UUIDS.characteristics.deviceInfo) {
      const encoder = new TextEncoder()
      const data = encoder.encode('TremorGuard-W1 v1.0.0')
      return new DataView(data.buffer)
    }

    return new DataView(new ArrayBuffer(0))
  }

  async write(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    data: ArrayBuffer,
    options?: WriteOptions,
  ): Promise<void> {
    if (!this.isConnected(deviceId)) {
      throw { code: BleErrorCode.DEVICE_NOT_FOUND, message: 'Not connected', deviceId }
    }

    logger.debug(`Mock: write ${characteristicUUID}, ${data.byteLength} bytes`)
    await this.delay(3 + Math.random() * 5)

    if (options?.withResponse) {
      logger.debug('Mock: write with response acknowledged')
    }
  }

  async subscribe(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    callback: (data: DataView) => void,
  ): Promise<() => void> {
    if (!this.isConnected(deviceId)) {
      throw { code: BleErrorCode.DEVICE_NOT_FOUND, message: 'Not connected', deviceId }
    }

    logger.debug(`Mock: subscribe to ${characteristicUUID}`)

    const sub: MockSubscription = { deviceId, serviceUUID, characteristicUUID, callback }

    if (characteristicUUID === BLE_UUIDS.characteristics.tremorData) {
      sub.intervalId = setInterval(() => {
        const buffer = new ArrayBuffer(24)
        const view = new DataView(buffer)
        view.setFloat32(0, 0.025 + Math.random() * 0.005, true)
        view.setFloat32(4, 4.5 + Math.random() * 1.0, true)
        view.setFloat32(8, 0.03 + Math.random() * 0.01, true)
        view.setFloat32(12, 0.02 + Math.random() * 0.005, true)
        view.setFloat32(16, 0.028 + Math.random() * 0.008, true)
        view.setUint8(20, Math.floor(1 + Math.random() * 3))
        view.setUint8(21, Math.floor(75 + Math.random() * 20))
        callback(view)
      }, 100)
    } else if (characteristicUUID === BLE_UUIDS.characteristics.batteryLevel) {
      sub.intervalId = setInterval(() => {
        const buffer = new ArrayBuffer(1)
        new DataView(buffer).setUint8(0, Math.floor(80 + Math.random() * 15))
        callback(new DataView(buffer))
      }, 60000)
    }

    this.subscriptions.add(sub)

    return () => {
      if (sub.intervalId) {
        clearInterval(sub.intervalId)
      }
      this.subscriptions.delete(sub)
      logger.debug(`Mock: unsubscribed from ${characteristicUUID}`)
    }
  }

  onError(callback: (error: BleError) => void): () => void {
    this.errorCallbacks.add(callback)
    return () => this.errorCallbacks.delete(callback)
  }

  startHeartbeat(deviceId: string): void {
    logger.debug(`Mock: startHeartbeat for ${deviceId}`)
    const timer = setInterval(() => {
      logger.debug(`Mock: heartbeat ok for ${deviceId}`)
    }, 5000)
    this.simulatedHeartbeatTimers.set(deviceId, timer)
  }

  stopHeartbeat(deviceId: string): void {
    const timer = this.simulatedHeartbeatTimers.get(deviceId)
    if (timer) {
      clearInterval(timer)
      this.simulatedHeartbeatTimers.delete(deviceId)
      logger.debug(`Mock: stopHeartbeat for ${deviceId}`)
    }
  }

  onHeartbeatFailure(callback: (deviceId: string) => void): () => void {
    this.heartbeatFailureCallbacks.add(callback)
    return () => this.heartbeatFailureCallbacks.delete(callback)
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  destroy(): void {
    this.subscriptions.forEach((sub) => {
      if (sub.intervalId) clearInterval(sub.intervalId)
    })
    this.subscriptions.clear()
    this.simulatedHeartbeatTimers.forEach((t) => clearInterval(t))
    this.simulatedHeartbeatTimers.clear()
    this.connectedDevices.clear()
    this.deviceDiscoveredCallbacks.clear()
    this.connectionChangeCallbacks.clear()
    this.errorCallbacks.clear()
    this.heartbeatFailureCallbacks.clear()
  }
}
