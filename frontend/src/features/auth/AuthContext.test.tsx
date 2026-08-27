import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from './AuthContext'
import { useAuth } from './useAuth'

describe('AuthContext', () => {
  it('starts logged out', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.user).toBeNull()
  })

  it('login sets the mock user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    act(() => result.current.login())
    expect(result.current.user?.name).toBe('Dev User')
  })

  it('logout clears the user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    act(() => result.current.login())
    act(() => result.current.logout())
    expect(result.current.user).toBeNull()
  })

  it('throws when used outside an AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider')
  })
})
