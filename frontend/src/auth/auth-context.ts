import { createContext, useContext } from 'react'
import type { Permission, UserRole } from './permissions'

export type AuthUser = {
  id: string
  username: string
  displayName: string
  department: string
  role: UserRole
  roleLabel: string
  permissions: Permission[]
}

export type LoginResult = { ok: true } | { ok: false; message: string }

export type AuthContextValue = {
  user: AuthUser | null
  login: (username: string, password: string, remember: boolean) => Promise<LoginResult>
  logout: () => void
  hasPermission: (permission: Permission) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider.')
  return context
}
