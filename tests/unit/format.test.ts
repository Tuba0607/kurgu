import { describe, expect, it } from 'vitest'
import { daysSince, formatRelativeDate, splitEmailForWrapping } from '../../utils/format'

describe('splitEmailForWrapping', () => {
  it('splits before "@" and "." so the address wraps at natural points', () => {
    expect(splitEmailForWrapping('deniz.arslan@linakozmetik.example'))
      .toEqual(['deniz', '.arslan', '@linakozmetik', '.example'])
  })

  it('keeps the full address when the segments are joined', () => {
    const email = 'kurumsal.iletisim@uluslararasi-enerji.example'
    expect(splitEmailForWrapping(email).join('')).toBe(email)
  })

  it('returns a single segment when there is nothing to split', () => {
    expect(splitEmailForWrapping('admin')).toEqual(['admin'])
  })
})

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
