import type { ContentSortValue, ContentStatusValue, ContentTypeValue } from './content'

// Turkish, shareable URLs. The API keeps its English parameter names; the pages
// translate between the URL (e.g. "?durum=onay") and the API values ("IN_REVIEW").
// Also used by the server middleware that redirects the old English URLs.

export const PATHS = {
  clients: '/musteriler',
  contents: '/icerikler',
} as const

/** Query parameter names in the address bar. */
export const QUERY_KEYS = {
  search: 'ara',
  status: 'durum',
  clientId: 'musteri',
  type: 'tur',
  sort: 'sirala',
  page: 'sayfa',
} as const

export const STATUS_SLUGS: Record<ContentStatusValue, string> = {
  DRAFT: 'taslak',
  IN_REVIEW: 'onay',
  PUBLISHED: 'yayinda',
}

export const TYPE_SLUGS: Record<ContentTypeValue, string> = {
  SOCIAL_POST: 'sosyal-medya',
  BLOG_POST: 'blog',
  WEB_PAGE: 'web-sayfasi',
}

export const CONTENT_SORT_SLUGS: Record<ContentSortValue, string> = {
  newest: 'son-eklenen',
  scheduled: 'yayin-tarihi',
  waiting: 'bekleyen',
}

export type ClientSortSlugKey = 'newest' | 'name' | 'contents'
export const CLIENT_SORT_SLUGS: Record<ClientSortSlugKey, string> = {
  newest: 'son-eklenen',
  name: 'ad',
  contents: 'icerik-sayisi',
}

/** Value for a URL slug ("onay" -> "IN_REVIEW"); '' for a missing or unknown slug. */
export function fromSlug<T extends string>(slugs: Record<T, string>, slug: string): T | '' {
  const entry = (Object.entries(slugs) as Array<[T, string]>).find(([, value]) => value === slug)
  return entry ? entry[0] : ''
}

export const contentPath = (id: string) => `${PATHS.contents}/${encodeURIComponent(id)}`
export const clientPath = (id: string) => `${PATHS.clients}/${encodeURIComponent(id)}`

/**
 * Maps an old English URL ("/contents?status=IN_REVIEW&clientId=x") to the
 * Turkish one ("/icerikler?durum=onay&musteri=x"). Returns null for other paths.
 */
export function legacyToTurkishUrl(path: string, query: Record<string, string>): string | null {
  const match = path.match(/^\/(clients|contents)(\/.*)?$/)
  if (!match) return null
  const base = match[1] === 'clients' ? PATHS.clients : PATHS.contents
  const params = new URLSearchParams()
  const set = (key: string, value: string) => {
    if (value) params.set(key, value)
  }
  set(QUERY_KEYS.search, query.search ?? '')
  set(QUERY_KEYS.status, STATUS_SLUGS[query.status as ContentStatusValue] ?? '')
  set(QUERY_KEYS.clientId, query.clientId ?? '')
  set(QUERY_KEYS.type, TYPE_SLUGS[query.type as ContentTypeValue] ?? '')
  const sortSlugs: Record<string, string> = match[1] === 'clients' ? CLIENT_SORT_SLUGS : CONTENT_SORT_SLUGS
  set(QUERY_KEYS.sort, sortSlugs[query.sort ?? ''] ?? '')
  set(QUERY_KEYS.page, query.page ?? '')
  const search = params.toString()
  return `${base}${match[2] ?? ''}${search ? `?${search}` : ''}`
}
