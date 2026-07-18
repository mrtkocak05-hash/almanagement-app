import { useAuthStore } from '@/store/authStore'

const BASE_URL = '/api'

type UnauthorizedHandler = () => void
let _onUnauthorized: UnauthorizedHandler | null = null

export function configureApi(onUnauthorized: UnauthorizedHandler) {
  _onUnauthorized = onUnauthorized
}

function getToken(): string | null {
  return useAuthStore.getState().accessToken
}

function getRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken
}

async function tryRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return null
    const json = await res.json() as { success: boolean; data?: { accessToken: string } }
    if (!json.success || !json.data) return null
    useAuthStore.getState().updateAccessToken(json.data.accessToken)
    return json.data.accessToken
  } catch { return null }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  // Auto-refresh on 401 TOKEN_EXPIRED
  if (res.status === 401) {
    const body = await res.clone().json().catch(() => ({})) as { code?: string }
    if (body.code === 'TOKEN_EXPIRED') {
      const newToken = await tryRefresh()
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`
        res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
      }
    }
    if (res.status === 401) {
      _onUnauthorized?.()
      throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.')
    }
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(errBody.message ?? `API ${res.status}: ${res.statusText}`)
  }
  const json = await res.json() as { success: boolean; data: T; message?: string }
  if (!json.success) throw new Error(json.message ?? 'API error')
  return json.data
}

async function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' })
}

async function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) })
}

async function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
}

async function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' })
}

async function postPublic<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(errBody.message ?? `API ${res.status}: ${res.statusText}`)
  }
  const json = await res.json() as { success: boolean; data: T; message?: string }
  if (!json.success) throw new Error(json.message ?? 'API error')
  return json.data
}

export const api = { get, post, put, del, postPublic }
