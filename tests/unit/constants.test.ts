import { $Enums } from '@prisma/client'
import { describe, expect, it } from 'vitest'
import {
  CONTENT_STATUS_LABELS,
  CONTENT_STATUSES,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPES,
} from '#shared/constants/content'

describe('shared content constants', () => {
  it('match the Prisma ContentType enum', () => {
    expect([...CONTENT_TYPES].sort()).toEqual(Object.values($Enums.ContentType).sort())
  })

  it('match the Prisma ContentStatus enum', () => {
    expect([...CONTENT_STATUSES].sort()).toEqual(Object.values($Enums.ContentStatus).sort())
  })

  it('have a Turkish label for every value', () => {
    expect(CONTENT_TYPE_LABELS).toEqual({
      SOCIAL_POST: 'Sosyal medya gönderisi',
      BLOG_POST: 'Blog yazısı',
      WEB_PAGE: 'Web sayfası',
    })
    expect(CONTENT_STATUS_LABELS).toEqual({
      DRAFT: 'Taslak',
      IN_REVIEW: 'Onay bekliyor',
      PUBLISHED: 'Yayında',
    })
  })
})

describe('contentCharLimit', () => {
  it('uses the platform limit, capped at the stored maximum', async () => {
    const { contentCharLimit } = await import('../../shared/constants/content')
    expect(contentCharLimit('X')).toBe(280)
    expect(contentCharLimit('INSTAGRAM')).toBe(2200)
    expect(contentCharLimit('LINKEDIN')).toBe(3000)
    expect(contentCharLimit('FACEBOOK')).toBe(20_000)
    expect(contentCharLimit(null)).toBe(20_000)
  })
})
