import { describe, expect, it } from 'vitest'
import { resolvePublishedAtOnCreate, resolvePublishedAtOnUpdate } from '../../server/utils/published-at'

const now = new Date('2026-11-20T12:00:00.000Z')
const earlier = new Date('2026-10-01T09:00:00.000Z')

describe('resolvePublishedAtOnCreate', () => {
  it('sets publishedAt only for PUBLISHED content', () => {
    expect(resolvePublishedAtOnCreate('PUBLISHED', now)).toBe(now)
    expect(resolvePublishedAtOnCreate('DRAFT', now)).toBeNull()
    expect(resolvePublishedAtOnCreate('IN_REVIEW', now)).toBeNull()
  })
})

describe('resolvePublishedAtOnUpdate', () => {
  it('keeps the stored value when status is not updated', () => {
    expect(resolvePublishedAtOnUpdate({ status: 'PUBLISHED', publishedAt: earlier }, undefined, now)).toBeUndefined()
    expect(resolvePublishedAtOnUpdate({ status: 'DRAFT', publishedAt: null }, undefined, now)).toBeUndefined()
  })

  it('sets now when content is published for the first time', () => {
    expect(resolvePublishedAtOnUpdate({ status: 'DRAFT', publishedAt: null }, 'PUBLISHED', now)).toBe(now)
    expect(resolvePublishedAtOnUpdate({ status: 'IN_REVIEW', publishedAt: null }, 'PUBLISHED', now)).toBe(now)
  })

  it('keeps the original date when an already published content stays published', () => {
    expect(resolvePublishedAtOnUpdate({ status: 'PUBLISHED', publishedAt: earlier }, 'PUBLISHED', now)).toBeUndefined()
  })

  it('backfills a missing date for published content', () => {
    expect(resolvePublishedAtOnUpdate({ status: 'PUBLISHED', publishedAt: null }, 'PUBLISHED', now)).toBe(now)
  })

  it('clears publishedAt when content is unpublished', () => {
    expect(resolvePublishedAtOnUpdate({ status: 'PUBLISHED', publishedAt: earlier }, 'DRAFT', now)).toBeNull()
    expect(resolvePublishedAtOnUpdate({ status: 'PUBLISHED', publishedAt: earlier }, 'IN_REVIEW', now)).toBeNull()
  })

  it('is a no-op when a non-published content changes to another non-published status', () => {
    expect(resolvePublishedAtOnUpdate({ status: 'DRAFT', publishedAt: null }, 'IN_REVIEW', now)).toBeUndefined()
  })

  it('sets a fresh date when content is re-published after being unpublished', () => {
    // After unpublishing, publishedAt is null, so re-publishing records a new date.
    expect(resolvePublishedAtOnUpdate({ status: 'DRAFT', publishedAt: null }, 'PUBLISHED', now)).toBe(now)
  })
})
