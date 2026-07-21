import type { AuthUser } from './auth-context'

export const SESSION_UPDATED_EVENT = 'siih:session-updated'
export const SESSION_EXPIRED_EVENT = 'siih:session-expired'

const LOCAL_SESSION_KEY = 'siih.auth.local'
const TAB_SESSION_KEY = 'siih.auth.tab'

export type StoredSession = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  refreshTokenExpiresAt: string
  user: AuthUser
  persistent: boolean
}

export type SessionTokens = Omit<StoredSession, 'persistent'>

export function readStoredSession(): StoredSession | null {
  for (const [storage, key] of [[sessionStorage, TAB_SESSION_KEY], [localStorage, LOCAL_SESSION_KEY]] as const) {
    try {
      const value = storage.getItem(key)
      if (!value) continue
      const parsed = JSON.parse(value) as StoredSession
      if (parsed.refreshToken && parsed.accessToken && parsed.user?.role && Date.parse(parsed.refreshTokenExpiresAt) > Date.now()) {
        return parsed
      }
      storage.removeItem(key)
    } catch {
      storage.removeItem(key)
    }
  }
  return null
}

export function writeStoredSession(tokens: SessionTokens, persistent: boolean) {
  clearStoredSession()
  const storage = persistent ? localStorage : sessionStorage
  const key = persistent ? LOCAL_SESSION_KEY : TAB_SESSION_KEY
  storage.setItem(key, JSON.stringify({ ...tokens, persistent } satisfies StoredSession))
}

export function clearStoredSession() {
  localStorage.removeItem(LOCAL_SESSION_KEY)
  sessionStorage.removeItem(TAB_SESSION_KEY)
}

export function dispatchSessionEvent(name: typeof SESSION_UPDATED_EVENT | typeof SESSION_EXPIRED_EVENT) {
  window.dispatchEvent(new Event(name))
}
