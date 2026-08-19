import { apiFetch, setTokens, clearTokens, getRefreshToken, AuthTokens } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface MessageResponse {
  message: string;
}

export async function login(data: LoginRequest): Promise<AuthTokens> {
  const tokens = await apiFetch<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setTokens(tokens);
  return tokens;
}

export async function register(data: RegisterRequest): Promise<AuthTokens> {
  const tokens = await apiFetch<AuthTokens>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setTokens(tokens);
  return tokens;
}

export async function logout(): Promise<MessageResponse> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return { message: '已注销' };
  }
  try {
    return await apiFetch<MessageResponse>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } finally {
    clearTokens();
  }
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('tremorguard_token');
}