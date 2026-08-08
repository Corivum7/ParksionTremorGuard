export interface TremorReading {
  id: string
  clientId: string
  serverId?: string
  patientId: string
  deviceId: string
  timestamp: number
  durationMs: number
  amplitude: TremorAmplitude
  frequencyHz: number
  severity: TremorSeverity
  type: TremorType
  accelerometerData?: AccelerometerSample[]
  gyroscopeData?: GyroscopeSample[]
  batteryLevel: number
  createdAt: number
  syncStatus: 'synced' | 'pending' | 'conflict'
}

export interface AccelerometerSample {
  t: number
  x: number
  y: number
  z: number
}

export interface GyroscopeSample {
  t: number
  x: number
  y: number
  z: number
}

export type TremorSeverity = 'none' | 'mild' | 'moderate' | 'severe'

export type TremorType = 'rest' | 'postural' | 'kinetic' | 'intentional'

export interface TremorAmplitude {
  x: number
  y: number
  z: number
  magnitude: number
}

export interface TremorSummary {
  date: string
  totalEpisodes: number
  averageSeverity: TremorSeverity
  maxSeverity: TremorSeverity
  totalDurationMs: number
  medicationEffectiveness?: number
}
