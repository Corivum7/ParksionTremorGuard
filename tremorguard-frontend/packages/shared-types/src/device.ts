export interface DeviceInfo {
  id: string
  clientId: string
  serverId?: string
  name: string
  macAddress: string
  serialNumber: string
  firmwareVersion: string
  hardwareVersion: string
  model: string
  patientId?: string
  status: DeviceStatus
  pairedAt?: number
  lastConnectedAt?: number
  batteryLevel: number
  createdAt: number
  updatedAt: number
  syncStatus: 'synced' | 'pending' | 'conflict'
}

export type DeviceStatus = 'unpaired' | 'paired' | 'connected' | 'disconnected' | 'low_battery'

export interface DeviceBond {
  deviceId: string
  patientId: string
  bondedAt: number
  unbondedAt?: number
  isActive: boolean
}

export interface BleServiceUUIDs {
  tremorService: string
  deviceInfoService: string
  batteryService: string
}

export interface BleCharacteristicUUIDs {
  tremorData: string
  tremorConfig: string
  deviceInfo: string
  batteryLevel: string
  heartbeat: string
}

export const BLE_UUIDS: { services: BleServiceUUIDs; characteristics: BleCharacteristicUUIDs } = {
  services: {
    tremorService: '0000ffe0-0000-1000-8000-00805f9b34fb',
    deviceInfoService: '0000180a-0000-1000-8000-00805f9b34fb',
    batteryService: '0000180f-0000-1000-8000-00805f9b34fb',
  },
  characteristics: {
    tremorData: '0000ffe1-0000-1000-8000-00805f9b34fb',
    tremorConfig: '0000ffe2-0000-1000-8000-00805f9b34fb',
    deviceInfo: '00002a29-0000-1000-8000-00805f9b34fb',
    batteryLevel: '00002a19-0000-1000-8000-00805f9b34fb',
    heartbeat: '0000ffe3-0000-1000-8000-00805f9b34fb',
  },
}
