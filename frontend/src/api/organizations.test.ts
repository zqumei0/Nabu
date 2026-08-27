import { describe, expect, it } from 'vitest'
import { getOrganization, listOrganizations } from './organizations'

describe('getOrganization', () => {
  it('returns the matching organization', async () => {
    const org = await getOrganization('org-1')
    expect(org?.name).toBe('Acme Corp')
  })

  it('returns undefined when not found', async () => {
    const org = await getOrganization('does-not-exist')
    expect(org).toBeUndefined()
  })
})

describe('listOrganizations', () => {
  it('returns all fixture organizations', async () => {
    const orgs = await listOrganizations()
    expect(orgs).toHaveLength(2)
  })
})
