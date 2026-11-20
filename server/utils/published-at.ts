import type { ContentStatusValue } from '#shared/constants/content'

/** publishedAt for a newly created content. */
export function resolvePublishedAtOnCreate(
  status: ContentStatusValue,
  now: Date = new Date(),
): Date | null {
  return status === 'PUBLISHED' ? now : null
}

/**
 * publishedAt for an update. Returns `undefined` when the stored value must be kept.
 *
 * - status not part of the update        -> keep
 * - becomes PUBLISHED for the first time -> now
 * - already PUBLISHED and stays PUBLISHED -> keep (backfills `now` if it was missing)
 * - moves away from PUBLISHED            -> null
 */
export function resolvePublishedAtOnUpdate(
  current: { status: ContentStatusValue, publishedAt: Date | null },
  nextStatus: ContentStatusValue | undefined,
  now: Date = new Date(),
): Date | null | undefined {
  if (nextStatus === undefined) return undefined

  if (nextStatus === 'PUBLISHED') {
    if (current.status === 'PUBLISHED' && current.publishedAt) return undefined
    return now
  }

  return current.publishedAt === null ? undefined : null
}
