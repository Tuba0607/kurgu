import { describe, expect, it } from 'vitest'
import { isAuthorizedCronRequest } from '../../server/utils/cron-auth'

const SECRET = 'a'.repeat(32)

describe('isAuthorizedCronRequest', () => {
  it('accepts the exact bearer secret', () => {
    expect(isAuthorizedCronRequest(`Bearer ${SECRET}`, SECRET)).toBe(true)
  })

  it.each([
    [undefined, SECRET],
    ['', SECRET],
    [`Bearer ${SECRET}x`, SECRET],
    [SECRET, SECRET],
    ['Bearer wrong', SECRET],
  ])('rejects header %j', (header, secret) => {
    expect(isAuthorizedCronRequest(header, secret)).toBe(false)
  })

  it('never authorizes when the secret is missing or too short', () => {
    expect(isAuthorizedCronRequest('Bearer ', '')).toBe(false)
    expect(isAuthorizedCronRequest('Bearer short', 'short')).toBe(false)
    expect(isAuthorizedCronRequest(`Bearer ${SECRET}`, undefined)).toBe(false)
  })
})
