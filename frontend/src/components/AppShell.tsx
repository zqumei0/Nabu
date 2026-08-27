import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="font-semibold">Nabu</span>
          <Link to="/">Dashboard</Link>
          <Link to="/vulnerabilities">Vulnerabilities</Link>
          <Link to="/settings">Settings</Link>
        </div>
        <div className="flex items-center gap-4">
          <span>{user?.name}</span>
          <button type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </nav>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
