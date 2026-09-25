/**
 * Authentication API service for CityPulse.
 * Communicates with the backend /api/auth endpoints.
 */

import { apiRequest } from './apiClient';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/* ------------------------------------------------------------------ */
/* Token storage (in-memory + sessionStorage for persistence)          */
/* ------------------------------------------------------------------ */

const TOKEN_KEY = 'citypulse_auth_token';

export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable – token will only last for this page session.
  }
}

export function clearStoredToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore.
  }
}

/* ------------------------------------------------------------------ */
/* Authenticated request helper                                        */
/* ------------------------------------------------------------------ */

export async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return apiRequest<T>(path, { ...init, headers });
}

/* ------------------------------------------------------------------ */
/* API functions                                                       */
/* ------------------------------------------------------------------ */

export async function register(payload: RegisterPayload): Promise<TokenResponse> {
  const res = await apiRequest<TokenResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  storeToken(res.access_token);
  return res;
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const res = await apiRequest<TokenResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  storeToken(res.access_token);
  return res;
}

export async function getCurrentUser(): Promise<AuthUser> {
  return authRequest<AuthUser>('/api/auth/me');
}

export async function logout(): Promise<void> {
  try {
    await authRequest<unknown>('/api/auth/logout', { method: 'POST' });
  } catch {
    // Server-side logout is best-effort; clear local state regardless.
  }
  clearStoredToken();
}
