import { apiFetch } from './client';

export interface HealthResponse {
  status: string;
  db?: string;
}

export async function checkHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health/live');
}

export async function checkReadiness(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health/ready');
}