import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, type AuthResponse } from '../api'
import { AuthContext, type AuthContextValue, type AuthUser, type LoginResult } from './auth-context'
import type { Permission, UserRole } from './permissions'
import {
  clearStoredSession,
  dispatchSessionEvent,
  readStoredSession,
  SESSION_EXPIRED_EVENT,
  SESSION_UPDATED_EVENT,
  type StoredSession,
  writeStoredSession,
} from './session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => readStoredSession())
  const activeRefreshToken = session?.refreshToken

  const logout = useCallback(async () => {
    const current = readStoredSession()
    try {
      if (current) await api.logout(current.refreshToken)
    } catch {
      // Local revocation still applies if the API is temporarily unavailable.
    }
    clearStoredSession()
    setSession(null)
  }, [])

  useEffect(() => {
    if (!session) return
    const remaining = Date.parse(session.refreshTokenExpiresAt) - Date.now()
    if (remaining <= 0) {
      void logout()
      return
    }
    const timeout = window.setTimeout(() => void logout(), Math.min(remaining, 2_147_000_000))
    return () => window.clearTimeout(timeout)
  }, [logout, session])

  useEffect(() => {
    const syncSession = () => setSession(readStoredSession())
    const expireSession = () => setSession(null)
    window.addEventListener('storage', syncSession)
    window.addEventListener(SESSION_UPDATED_EVENT, syncSession)
    window.addEventListener(SESSION_EXPIRED_EVENT, expireSession)
    return () => {
      window.removeEventListener('storage', syncSession)
      window.removeEventListener(SESSION_UPDATED_EVENT, syncSession)
      window.removeEventListener(SESSION_EXPIRED_EVENT, expireSession)
    }
  }, [])

  useEffect(() => {
    if (!activeRefreshToken) return
    let active = true
    api.getMe().then((user) => {
      if (!active) return
      const current = readStoredSession()
      if (!current) return
      const normalized = normalizeUser(user)
      writeStoredSession({ ...current, user: normalized }, current.persistent)
      setSession({ ...current, user: normalized })
    }).catch(() => undefined)
    return () => { active = false }
  }, [activeRefreshToken])

  const login = useCallback(async (username: string, password: string, remember: boolean): Promise<LoginResult> => {
    try {
      const response = await api.login(username.trim(), password, remember)
      const stored = toStoredSession(response, remember)
      writeStoredSession(stored, remember)
      setSession(stored)
      dispatchSessionEvent(SESSION_UPDATED_EVENT)
      return { ok: true }
    } catch (reason) {
      return {
        ok: false,
        message: reason instanceof ApiError ? reason.message : 'No se pudo verificar el acceso con el backend.',
      }
    }
  }, [])

  const register = useCallback(async (payload: Parameters<typeof api.register>[0]): Promise<LoginResult> => {
    try {
      const response = await api.register({ ...payload, username: payload.username.trim() })
      const stored = toStoredSession(response, payload.remember)
      writeStoredSession(stored, payload.remember)
      setSession(stored)
      dispatchSessionEvent(SESSION_UPDATED_EVENT)
      return { ok: true }
    } catch (reason) {
      return {
        ok: false,
        message: reason instanceof ApiError ? reason.message : 'No se pudo crear la cuenta academica.',
      }
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    login,
    register,
    logout,
    hasPermission: (permission) => Boolean(session?.user.permissions.includes(permission)),
  }), [login, logout, register, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function toStoredSession(response: AuthResponse, persistent: boolean): StoredSession {
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    accessTokenExpiresAt: response.accessTokenExpiresAt,
    refreshTokenExpiresAt: response.refreshTokenExpiresAt,
    user: normalizeUser(response.user),
    persistent,
  }
}

function normalizeUser(user: AuthResponse['user']): AuthUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    department: user.department,
    role: user.role as UserRole,
    roleLabel: user.roleLabel,
    permissions: user.permissions as Permission[],
  }
}
