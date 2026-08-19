import { apiFetch } from './client';

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  onboarding_state: string;
  created_at: string;
}

export async function getMe(): Promise<UserResponse> {
  return apiFetch<UserResponse>('/me');
}