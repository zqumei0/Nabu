import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { userFixtures } from '../api/fixtures/users'
import { AuthContext, type AuthContextValue } from '../features/auth/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'

function renderProtected(loggedIn: boolean) {
  const authValue: AuthContextValue = {
    user: loggedIn ? userFixtures[0] : null,
    login: () => {},
    logout: () => {},
  }

  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects to /login when logged out', () => {
    renderProtected(false)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders children when logged in', () => {
    renderProtected(true)
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
