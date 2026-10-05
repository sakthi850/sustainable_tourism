import { apiRequest, setToken } from './api';
import { AuthResponse, User } from '../types';

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: { name, email, password }, auth: false });
  setToken(res.token);
  return res;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false });
  setToken(res.token);
  return res;
}

export function logout(): void {
  setToken(null);
}

export async function fetchMe(): Promise<User> {
  const res = await apiRequest<{ success: true; user: User }>('/auth/me');
  return res.user;
}
