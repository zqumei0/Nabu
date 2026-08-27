// MOCK AUTH — no real OAuth/OIDC flow. ADR-0006 decided GitHub OAuth for
// humans but it isn't implemented in the backend yet. Rip this out and
// replace with a real session/token flow once that lands.
import { createContext, useState, type ReactNode } from 'react'
import { userFixtures } from '../../api/fixtures/users'
import type { User } from '../../api/types'

const FAKE_USER: User = userFixtures[0]

export interface AuthContextValue {
  user: User | null
  login: () => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = () => setUser(FAKE_USER)
  const logout = () => setUser(null)

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}
