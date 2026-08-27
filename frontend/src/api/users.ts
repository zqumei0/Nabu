import { apiDelay, USE_MOCK_API } from './client'
import { userFixtures } from './fixtures/users'
import type { User } from './types'

// Matches AuthContext's mock FAKE_USER — the same fixture record represents
// "the current user" throughout the mock-backed app.
export const CURRENT_USER_ID = 'user-1'

export async function getCurrentUser(): Promise<User | undefined> {
  if (USE_MOCK_API) {
    return apiDelay(userFixtures.find((user) => user.id === CURRENT_USER_ID))
  }
  throw new Error('Not implemented — see backend/docs/design.md#api-surface')
}

export async function getUser(id: string): Promise<User | undefined> {
  if (USE_MOCK_API) {
    return apiDelay(userFixtures.find((user) => user.id === id))
  }
  throw new Error('Not implemented — see backend/docs/design.md#api-surface')
}

export async function listUsers(): Promise<User[]> {
  if (USE_MOCK_API) {
    return apiDelay(userFixtures)
  }
  throw new Error('Not implemented — see backend/docs/design.md#api-surface')
}
