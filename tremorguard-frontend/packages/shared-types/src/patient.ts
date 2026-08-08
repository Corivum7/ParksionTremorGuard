export interface Patient {
  id: string
  clientId: string
  serverId?: string
  name: string
  gender: 'male' | 'female' | 'other'
  birthDate: string
  heightCm: number
  weightKg: number
  diagnosisDate: string
  diseaseStage: 'early' | 'middle' | 'advanced'
  primarySymptom: string
  createdAt: number
  updatedAt: number
  syncStatus: 'synced' | 'pending' | 'conflict'
}

export interface PatientProfile {
  patientId: string
  medicalHistory: string[]
  allergies: string[]
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  doctorId?: string
}

export type DiseaseStage = Patient['diseaseStage']
