import { resetDemoData } from '../../../prisma/demo-data'

/**
 * Nightly demo reset, called by Vercel Cron (see vercel.json: 01:00 UTC = 04:00 Istanbul).
 *
 * Runs only when
 *   1. the request carries "Authorization: Bearer <CRON_SECRET>", and
 *   2. the deployment explicitly allows demo data (ALLOW_DEMO_SEED=1),
 * because it deletes every client and content.
 */
export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    throw createError({ statusCode: 503, message: 'CRON_SECRET tanımlı değil; demo sıfırlama devre dışı.' })
  }
  if (!isAuthorizedCronRequest(getRequestHeader(event, 'authorization'), secret)) {
    throw createError({ statusCode: 401, message: 'Yetkisiz istek.' })
  }
  if (process.env.ALLOW_DEMO_SEED !== '1') {
    throw createError({ statusCode: 403, message: 'Bu ortamda demo verisi sıfırlanamaz (ALLOW_DEMO_SEED=1 değil).' })
  }

  const result = await resetDemoData(prisma)
  return { ok: true, ...result, resetAt: new Date().toISOString() }
})
