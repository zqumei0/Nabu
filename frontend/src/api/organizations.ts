import { apiDelay, USE_MOCK_API } from './client'
import { organizationFixtures } from './fixtures/organizations'
import type { Organization } from './types'

export async function getOrganization(id: string): Promise<Organization | undefined> {
  if (USE_MOCK_API) {
    return apiDelay(organizationFixtures.find((org) => org.id === id))
  }
  throw new Error('Not implemented — see backend/docs/design.md#api-surface')
}

export async function listOrganizations(): Promise<Organization[]> {
  if (USE_MOCK_API) {
    return apiDelay(organizationFixtures)
  }
  throw new Error('Not implemented — see backend/docs/design.md#api-surface')
}
