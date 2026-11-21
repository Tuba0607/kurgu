import { describe, expect, it } from 'vitest'
import { daysSince, formatRelativeDate, formatShortDate } from '../../utils/format'

describe('relative dates (tr-TR)', () => {
  const now = new Date('2026-11-21T12:00:00')
  it.each([
    ['2026-11-21T08:00:00', 'bugün'],
    ['2026-11-20T23:00:00', 'dün'],
    ['2026-11-19T10:00:00', '2 gün önce'],
    ['2026-11-22T10:00:00', 'yarın'],
    ['2026-11-26T10:00:00', '5 gün sonra'],
    ['2026-11-07T10:00:00', '2 hafta önce'],
  ])('%s -> %s', (value, expected) => {
    expect(formatRelativeDate(value, now)).toBe(expected)
  })

  it('counts whole calendar days since a date', () => {
    expect(daysSince('2026-11-14T23:59:00', now)).toBe(7)
  })
})

describe('formatShortDate (tr-TR, Europe/Istanbul)', () => {
  const now = new Date('2026-11-21T12:00:00Z')

  it('drops the year within the current year', () => {
    expect(formatShortDate('2026-10-17T09:00:00Z', now)).toBe('17 Eki')
  })

  it('keeps the year for other years', () => {
    expect(formatShortDate('2025-10-17T09:00:00Z', now)).toBe('17 Eki 2025')
  })

  it('uses Istanbul time at the year boundary', () => {
    // 31 Dec 2025 22:30 UTC is already 1 Jan 2026 in Istanbul.
    expect(formatShortDate('2025-12-31T22:30:00Z', now)).toBe('1 Oca')
  })

  it('returns the empty value for missing dates', () => {
    expect(formatShortDate(null, now)).toBe('—')
  })
})
