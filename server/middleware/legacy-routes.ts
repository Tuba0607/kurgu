import { legacyToTurkishUrl } from '#shared/constants/routes'

/** 301-redirects the old English page URLs (/clients, /contents) to the Turkish ones. */
export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  if (url.pathname.startsWith('/api/')) return
  const target = legacyToTurkishUrl(url.pathname, Object.fromEntries(url.searchParams))
  if (target) return sendRedirect(event, target, 301)
})
