export interface Medication {
  id: string
  clientId: string
  serverId?: string
  patientId: string
  name: string
  genericName?: string
  dosage: string
  frequency: MedicationFrequency
  timesPerDay?: number
  scheduledTimes?: string[]
  startDate: string
  endDate?: string
  prescribingDoctor?: string
  notes?: string
  status: 'active' | 'paused' | 'discontinued'
  createdAt: number
  updatedAt: number
  syncStatus: 'synced' | 'pending' | 'conflict'
}

export interface MedicationRecord {
  id: string
  clientId: string
  serverId?: string
  patientId: string
  medicationId: string
  scheduledTime: number
  takenTime?: number
  status: MedicationAdherenceStatus
  dosage: string
  notes?: string
  createdAt: number
  syncStatus: 'synced' | 'pending' | 'conflict'
}

export type MedicationFrequency =
  | 'once_daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'four_times_daily'
  | 'as_needed'
  | 'weekly'

export type MedicationAdherenceStatus =
  | 'scheduled'
  | 'taken'
  | 'missed'
  | 'late'
  | 'skipped'

export interface AdherenceSummary {
  date: string
  totalDoses: number
  takenDoses: number
  missedDoses: number
  adherenceRate: number
}
