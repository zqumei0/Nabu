import { describe, expect, it } from 'vitest'
import { apiDelay, USE_MOCK_API } from './client'

describe('apiDelay', () => {
  it('resolves with the given data after a delay', async () => {
    const result = await apiDelay('hello', 5)
    expect(result).toBe('hello')
  })
})

describe('USE_MOCK_API', () => {
  it('defaults to true in the test environment', () => {
    expect(USE_MOCK_API).toBe(true)
  })
})
