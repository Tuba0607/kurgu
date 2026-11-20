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
