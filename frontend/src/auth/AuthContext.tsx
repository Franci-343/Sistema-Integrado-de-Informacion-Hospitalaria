import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue, type AuthUser, type LoginResult } from './auth-context'
import { demoAccounts, demoPassword } from './demoAccounts'
import { permissionsForRole, roleLabels } from './permissions'

const LOCAL_SESSION_KEY = 'siih.auth.local'
const TAB_SESSION_KEY = 'siih.auth.tab'
type StoredSession = {
  user: AuthUser
  expiresAt: number
  persistent: boolean
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => readSession())

  const logout = useCallback(() => {
    localStorage.removeItem(LOCAL_SESSION_KEY)
    sessionStorage.removeItem(TAB_SESSION_KEY)
    setSession(null)
  }, [])

  useEffect(() => {
    if (!session) return
    const remaining = session.expiresAt - Date.now()
    if (remaining <= 0) {
      logout()
      return
    }
    const timeout = window.setTimeout(logout, Math.min(remaining, 2_147_000_000))
    return () => window.clearTimeout(timeout)
  }, [logout, session])

  useEffect(() => {
    const syncSession = () => setSession(readSession())
    window.addEventListener('storage', syncSession)
    return () => window.removeEventListener('storage', syncSession)
  }, [])

  const login = useCallback(async (username: string, password: string, remember: boolean): Promise<LoginResult> => {
    await new Promise((resolve) => window.setTimeout(resolve, 320))
    const account = demoAccounts.find((candidate) => candidate.username === username.trim().toLowerCase())
    if (!account || password !== demoPassword) {
      return { ok: false, message: 'Usuario o contraseña incorrectos.' }
    }

    const user: AuthUser = {
      ...account,
      roleLabel: roleLabels[account.role],
      permissions: permissionsForRole(account.role),
    }
    const stored: StoredSession = {
      user,
      expiresAt: Date.now() + (remember ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000),
      persistent: remember,
    }
    localStorage.removeItem(LOCAL_SESSION_KEY)
    sessionStorage.removeItem(TAB_SESSION_KEY)
    const storage = remember ? localStorage : sessionStorage
    storage.setItem(remember ? LOCAL_SESSION_KEY : TAB_SESSION_KEY, JSON.stringify(stored))
    setSession(stored)
    return { ok: true }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    login,
    logout,
    hasPermission: (permission) => Boolean(session?.user.permissions.includes(permission)),
  }), [login, logout, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function readSession(): StoredSession | null {
  for (const [storage, key] of [[sessionStorage, TAB_SESSION_KEY], [localStorage, LOCAL_SESSION_KEY]] as const) {
    try {
      const value = storage.getItem(key)
      if (!value) continue
      const parsed = JSON.parse(value) as StoredSession
      if (parsed.expiresAt > Date.now() && parsed.user?.role) return parsed
      storage.removeItem(key)
    } catch {
      storage.removeItem(key)
    }
  }
  return null
}
