import { render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../features/auth/AuthContext'
import { useAuth } from '../features/auth/useAuth'
import { AppShell } from './AppShell'

function AutoLogin() {
  const { login } = useAuth()
  useEffect(() => {
    login()
  }, [login])
  return null
}

describe('AppShell', () => {
  it('renders nav links and the logged-in user name', () => {
    render(
      <AuthProvider>
        <AutoLogin />
        <MemoryRouter>
          <AppShell>
            <div>content</div>
          </AppShell>
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Vulnerabilities')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Dev User')).toBeInTheDocument()
  })
})
