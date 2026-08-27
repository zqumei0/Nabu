import { describe, expect, it } from 'vitest'
import { getCurrentUser, getUser, listUsers } from './users'

describe('getCurrentUser', () => {
  it('returns the mock current user', async () => {
    const user = await getCurrentUser()
    expect(user?.name).toBe('Dev User')
  })
})

describe('getUser', () => {
  it('returns the matching user', async () => {
    const user = await getUser('user-2')
    expect(user?.name).toBe('Alex Rivera')
  })

  it('returns undefined when not found', async () => {
    const user = await getUser('does-not-exist')
    expect(user).toBeUndefined()
  })
})

describe('listUsers', () => {
  it('returns all fixture users', async () => {
    const users = await listUsers()
    expect(users).toHaveLength(3)
  })
})
