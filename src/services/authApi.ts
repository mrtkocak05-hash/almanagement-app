import { api } from './api'
import type { LoginRequest, LoginResponse, AuthUser } from '@/types/auth'

async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({} as { message?: string })) as { message?: string }
    throw new Error(errBody.message ?? `Giriş başarısız (${res.status}).`)
  }
  const json = await res.json() as { success: boolean; data: LoginResponse; message?: string }
  if (!json.success) throw new Error(json.message ?? 'Giriş başarısız.')
  return json.data
}

async function logout(refreshToken: string | null): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {})
}

async function me(): Promise<AuthUser> {
  return api.get<AuthUser>('/auth/me')
}

async function forgotPassword(email: string): Promise<{ message: string }> {
  return api.post('/auth/forgot-password', { email })
}

async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return api.post('/auth/reset-password', { token, password })
}

async function changePassword(current_password: string, new_password: string): Promise<{ message: string }> {
  return api.post('/auth/change-password', { current_password, new_password })
}

export const authApi = { login, logout, me, forgotPassword, resetPassword, changePassword }
