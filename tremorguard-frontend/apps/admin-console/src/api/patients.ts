import { apiFetch } from './client';

export interface EmergencyContactPayload {
  name: string;
  phone: string;
  relationship: string;
}

export interface PatientCreate {
  name: string;
  gender: 'male' | 'female' | 'other';
  birth_date: string;
  height_cm: number;
  weight_kg: number;
  diagnosis_date: string;
  disease_stage: 'early' | 'middle' | 'advanced';
  primary_symptom: string;
  medical_history?: string;
  allergies?: string;
  emergency_contact: EmergencyContactPayload;
}

export interface PatientUpdate extends Partial<Omit<PatientCreate, 'emergency_contact'>> {
  emergency_contact?: EmergencyContactPayload;
}

export interface PatientResponse {
  id: string;
  user_id: string;
  name: string;
  gender: string;
  birth_date: string;
  height_cm: number;
  weight_kg: number;
  diagnosis_date: string;
  disease_stage: string;
  primary_symptom: string;
  medical_history: string;
  allergies: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  created_at: string;
  updated_at: string;
}

export async function listPatients(): Promise<PatientResponse[]> {
  return apiFetch<PatientResponse[]>('/patients');
}

export async function getPatient(patientId: string): Promise<PatientResponse> {
  return apiFetch<PatientResponse>(`/patients/${patientId}`);
}

export async function createPatient(data: PatientCreate): Promise<PatientResponse> {
  return apiFetch<PatientResponse>('/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePatient(
  patientId: string,
  data: PatientUpdate
): Promise<PatientResponse> {
  return apiFetch<PatientResponse>(`/patients/${patientId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deletePatient(patientId: string): Promise<void> {
  return apiFetch<void>(`/patients/${patientId}`, {
    method: 'DELETE',
  });
}