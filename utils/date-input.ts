// Helpers for the Turkish date picker ("gg.aa.yyyy" in the field, "YYYY-MM-DD" as value).

export const MONTH_NAMES_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
/** Week starts on Monday (Turkish convention). */
export const WEEKDAY_SHORT_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
export const WEEKDAY_LONG_TR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

const pad = (value: number) => String(value).padStart(2, '0')

/** Local date -> "YYYY-MM-DD" */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** "YYYY-MM-DD" -> local Date (noon, so DST never moves the day) or null. */
export function fromIsoDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
  return toIsoDate(date) === value ? date : null
}

/** "YYYY-MM-DD" -> "gg.aa.yyyy" */
export function isoToDisplay(value: string): string {
  const date = fromIsoDate(value)
  return date ? `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}` : ''
}

/** "gg.aa.yyyy" -> "YYYY-MM-DD", or null when incomplete / not a real date (e.g. 31.02.2026). */
export function displayToIso(value: string): string | null {
  const match = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!match) return null
  const iso = `${match[3]}-${match[2]}-${match[1]}`
  return fromIsoDate(iso) ? iso : null
}

/** Keeps digits only and inserts the dots while typing: "2111" -> "21.11" */
export function maskDisplayDate(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('.')
}

/** 6 x 7 grid of days for a month view, Monday first (includes leading / trailing days). */
export function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1, 12)
  const offset = (first.getDay() + 6) % 7 // Monday = 0
  return Array.from({ length: 42 }, (_, index) => new Date(year, month, 1 - offset + index, 12))
}
