// Content enums mirrored from the Prisma schema so they can be used in the
// browser bundle without importing @prisma/client. A unit test guarantees they
// stay in sync with the generated Prisma enums.

export const CONTENT_TYPES = ['SOCIAL_POST', 'BLOG_POST', 'WEB_PAGE'] as const
export type ContentTypeValue = (typeof CONTENT_TYPES)[number]

export const CONTENT_STATUSES = ['DRAFT', 'IN_REVIEW', 'PUBLISHED'] as const
export type ContentStatusValue = (typeof CONTENT_STATUSES)[number]

// User-facing labels (Turkish UI).
export const CONTENT_TYPE_LABELS: Record<ContentTypeValue, string> = {
  SOCIAL_POST: 'Sosyal medya gönderisi',
  BLOG_POST: 'Blog yazısı',
  WEB_PAGE: 'Web sayfası',
}

// Compact variants for narrow columns (full label stays available as a tooltip).
export const CONTENT_TYPE_SHORT_LABELS: Record<ContentTypeValue, string> = {
  SOCIAL_POST: 'Sosyal medya',
  BLOG_POST: 'Blog yazısı',
  WEB_PAGE: 'Web sayfası',
}

export const CONTENT_STATUS_LABELS: Record<ContentStatusValue, string> = {
  DRAFT: 'Taslak',
  IN_REVIEW: 'Onay bekliyor',
  PUBLISHED: 'Yayında',
}
