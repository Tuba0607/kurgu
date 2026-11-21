import { timingSafeEqual } from 'node:crypto'

/**
 * Checks the "Authorization: Bearer <CRON_SECRET>" header Vercel Cron sends.
 * Constant-time comparison; an unset or short secret never authorizes.
 */
export function isAuthorizedCronRequest(authorization: string | undefined, secret: string | undefined): boolean {
  if (!secret || secret.length < 16 || !authorization) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(authorization)
  return expected.length === received.length && timingSafeEqual(expected, received)
}
