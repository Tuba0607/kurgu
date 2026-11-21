// A fixed time zone keeps server-rendered and client-rendered dates identical
// (avoids hydration mismatches) and matches the agency's location.
const TIME_ZONE = 'Europe/Istanbul'
const LOCALE = 'tr-TR'

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: TIME_ZONE,
})

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TIME_ZONE,
})

const numberFormatter = new Intl.NumberFormat(LOCALE)

export const EMPTY_VALUE = '—'

export function formatDate(value: string | Date | null | undefined): string {
  return value ? dateFormatter.format(new Date(value)) : EMPTY_VALUE
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return value ? dateTimeFormatter.format(new Date(value)) : EMPTY_VALUE
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

export function formatPercent(part: number, total: number): string {
  if (total === 0) return '%0'
  return `%${Math.round((part / total) * 100)}`
}

/** Two-letter initials for avatar placeholders, using Turkish casing rules. */
export function getInitials(name: string): string {
  // Only letters count, so names like "3D Studio" or "_Atlas" still get initials.
  const words = name.split(/\s+/).map(word => word.replace(/[^\p{L}]/gu, '')).filter(Boolean)
  const letters = words.length > 1 ? [words[0]![0], words[1]![0]] : [...(words[0] ?? '').slice(0, 2)]
  return letters.join('').toLocaleUpperCase(LOCALE) || '?'
}

/**
 * Splits an email into segments so it can wrap before "@" and "." instead of
 * mid-word (rendered with <wbr> between the segments).
 */
export function splitEmailForWrapping(email: string): string[] {
  return email.split(/(?=[@.])/)
}

const DAY_MS = 24 * 60 * 60 * 1000
const relativeFormatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'always' })

/** Whole days elapsed since `value` (0 = today). */
export function daysSince(value: string | Date, now: Date = new Date()): number {
  const start = new Date(value)
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((today.getTime() - startDay.getTime()) / DAY_MS)
}

/**
 * Relative date in Turkish: "bugün", "dün", "2 gün önce", "3 hafta önce";
 * future dates: "yarın", "5 gün sonra". Older than ~2 months: absolute date.
 */
export function formatRelativeDate(value: string | Date | null | undefined, now: Date = new Date()): string {
  if (!value) return EMPTY_VALUE
  const days = -daysSince(value, now)
  if (days === 0) return 'bugün'
  if (days === -1) return 'dün'
  if (days === 1) return 'yarın'
  // numeric: 'always' gives "2 gün önce" instead of the less common "evvelsi gün".
  if (Math.abs(days) < 7) return relativeFormatter.format(days, 'day')
  if (Math.abs(days) < 60) return relativeFormatter.format(Math.trunc(days / 7), 'week')
  return formatDate(value)
}
