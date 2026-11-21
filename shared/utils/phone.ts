// Turkish mobile phone helpers shared by the input mask (client) and the Zod schema.
// Canonical stored format: "+90 5XX XXX XX XX".

export const PHONE_PLACEHOLDER = '+90 5XX XXX XX XX'
export const PHONE_MAX_LENGTH = PHONE_PLACEHOLDER.length

/** National digits without the "+90" / "0" prefix and without a length limit. */
function extractNationalDigits(raw: string): string {
  let digits: string
  if (raw.trimStart().startsWith('+')) {
    // "+90", "+9" or "+" followed by the number (a damaged prefix is tolerated)
    digits = raw.replace(/^\s*\+\s*9?\s*0?/, '').replace(/\D/g, '')
  }
  else {
    digits = raw.replace(/\D/g, '')
    if (digits.length > 10 && digits.startsWith('90')) digits = digits.slice(2)
  }
  return digits.startsWith('0') ? digits.slice(1) : digits
}

/**
 * Extracts the national part (max. 10 digits, e.g. "5321234567") from whatever
 * the user typed or pasted: "0532 123 45 67", "+90 (532) 123-45-67", "5321234567"...
 */
export function toNationalDigits(raw: string): string {
  return extractNationalDigits(raw).slice(0, 10)
}

/** Formats national digits progressively: "53212" -> "+90 532 12". */
export function formatNationalDigits(national: string): string {
  if (!national) return ''
  const groups = [national.slice(0, 3), national.slice(3, 6), national.slice(6, 8), national.slice(8, 10)].filter(Boolean)
  return `+90 ${groups.join(' ')}`
}

/**
 * Full normalization used before saving: returns "+90 5XX XXX XX XX" for a
 * complete mobile number, otherwise null (invalid / incomplete).
 */
export function normalizeTurkishMobile(raw: string): string | null {
  const national = extractNationalDigits(raw)
  if (national.length !== 10 || !national.startsWith('5')) return null
  return formatNationalDigits(national)
}

export interface MaskedValue {
  value: string
  caret: number
}

/**
 * Applies the mask to the current input value and keeps the caret after the
 * same digit it was after before formatting. While only the beginning of the
 * prefix has been typed ("+", "+9", "+90", "0") the raw value is kept.
 */
export function maskPhoneInput(raw: string, caret: number): MaskedValue {
  if (/^\s*(?:\+\s*9?\s*0?|0)\s*$/.test(raw)) return { value: raw.trim(), caret: raw.trim().length }

  const national = toNationalDigits(raw)
  const value = formatNationalDigits(national)
  const digitsBeforeCaret = toNationalDigits(raw.slice(0, caret)).length

  if (digitsBeforeCaret === 0) return { value, caret: Math.min(4, value.length) }
  let seen = 0
  for (let index = 4; index < value.length; index++) {
    if (/\d/.test(value[index]!)) seen++
    if (seen === digitsBeforeCaret) return { value, caret: index + 1 }
  }
  return { value, caret: value.length }
}
