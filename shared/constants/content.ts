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

export const SOCIAL_PLATFORMS = ['INSTAGRAM', 'LINKEDIN', 'X', 'FACEBOOK'] as const
export type SocialPlatformValue = (typeof SOCIAL_PLATFORMS)[number]

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatformValue, string> = {
  INSTAGRAM: 'Instagram',
  LINKEDIN: 'LinkedIn',
  X: 'X',
  FACEBOOK: 'Facebook',
}

/** Caption / post length limits per platform (characters). */
export const SOCIAL_PLATFORM_CHAR_LIMITS: Record<SocialPlatformValue, number> = {
  INSTAGRAM: 2200,
  LINKEDIN: 3000,
  X: 280,
  FACEBOOK: 63206,
}

/** Maximum length of a content body (also enforced by the API schema). */
export const CONTENT_BODY_MAX_LENGTH = 20_000

/**
 * Limit shown by the character counters: the platform's limit for social posts,
 * never more than what the app can store (Facebook: 63,206 -> 20,000).
 */
export function contentCharLimit(platform: SocialPlatformValue | null | undefined): number {
  return platform ? Math.min(SOCIAL_PLATFORM_CHAR_LIMITS[platform], CONTENT_BODY_MAX_LENGTH) : CONTENT_BODY_MAX_LENGTH
}

/** Sort options of the content list. */
export const CONTENT_SORTS = ['newest', 'scheduled', 'waiting'] as const
export type ContentSortValue = (typeof CONTENT_SORTS)[number]

export const CONTENT_SORT_LABELS: Record<ContentSortValue, string> = {
  newest: 'Son eklenen',
  scheduled: 'Yayın tarihi',
  waiting: 'En uzun süredir bekleyen',
}

/** Days after which a content waiting for approval is highlighted. */
export const LONG_REVIEW_DAYS = 5

export const CONTENT_STATUS_LABELS: Record<ContentStatusValue, string> = {
  DRAFT: 'Taslak',
  IN_REVIEW: 'Onay bekliyor',
  PUBLISHED: 'Yayında',
}
