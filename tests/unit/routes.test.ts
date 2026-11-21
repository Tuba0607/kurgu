import { describe, expect, it } from 'vitest'
import { CONTENT_STATUSES, CONTENT_TYPES } from '../../shared/constants/content'
import { contentPath, fromSlug, legacyToTurkishUrl, STATUS_SLUGS, TYPE_SLUGS } from '../../shared/constants/routes'

describe('Turkish URL slugs', () => {
  it('maps every status and type to a unique slug and back', () => {
    for (const status of CONTENT_STATUSES) expect(fromSlug(STATUS_SLUGS, STATUS_SLUGS[status])).toBe(status)
    for (const type of CONTENT_TYPES) expect(fromSlug(TYPE_SLUGS, TYPE_SLUGS[type])).toBe(type)
    expect(STATUS_SLUGS).toEqual({ DRAFT: 'taslak', IN_REVIEW: 'onay', PUBLISHED: 'yayinda' })
  })

  it('ignores unknown or English values', () => {
    expect(fromSlug(STATUS_SLUGS, 'IN_REVIEW')).toBe('')
    expect(fromSlug(STATUS_SLUGS, '')).toBe('')
  })

  it('builds encoded detail paths', () => {
    expect(contentPath('seed_content_01')).toBe('/icerikler/seed_content_01')
  })
})

describe('legacyToTurkishUrl', () => {
  it.each([
    ['/contents', {}, '/icerikler'],
    ['/clients', {}, '/musteriler'],
    ['/clients/seed_client_lina_kozmetik', {}, '/musteriler/seed_client_lina_kozmetik'],
    ['/contents/abc', {}, '/icerikler/abc'],
    ['/contents', { status: 'IN_REVIEW', sort: 'waiting' }, '/icerikler?durum=onay&sirala=bekleyen'],
    ['/contents', { search: 'koy', clientId: 'x', type: 'WEB_PAGE', page: '2' }, '/icerikler?ara=koy&musteri=x&tur=web-sayfasi&sayfa=2'],
    ['/clients', { search: 'kahve', sort: 'name' }, '/musteriler?ara=kahve&sirala=ad'],
    ['/contents', { status: 'BOGUS' }, '/icerikler'],
  ])('%s %j -> %s', (path, query, expected) => {
    expect(legacyToTurkishUrl(path, query as Record<string, string>)).toBe(expected)
  })

  it('leaves other paths alone', () => {
    expect(legacyToTurkishUrl('/', {})).toBeNull()
    expect(legacyToTurkishUrl('/icerikler', {})).toBeNull()
    expect(legacyToTurkishUrl('/contentsx', {})).toBeNull()
  })
})
