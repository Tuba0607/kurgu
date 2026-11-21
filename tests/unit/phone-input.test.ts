import { describe, expect, it } from 'vitest'
import { clientCreateSchema } from '../../shared/schemas/client'
import { formatNationalDigits, maskPhoneInput, normalizeTurkishMobile, toNationalDigits } from '../../shared/utils/phone'

/** Simulates typing `keys` one by one at the end of the field through the mask. */
function type(keys: string, start = '') {
  let value = start
  for (const key of keys) value = maskPhoneInput(value + key, value.length + 1).value
  return value
}

describe('toNationalDigits', () => {
  it.each([
    ['0532 123 45 67', '5321234567'],
    ['+90 532 123 45 67', '5321234567'],
    ['+90 (532) 123-45-67', '5321234567'],
    ['905321234567', '5321234567'],
    ['5321234567', '5321234567'],
    ['Tel: 0532 123 45 67', '5321234567'],
    ['+9 532', '532'], // damaged prefix after a deletion
  ])('extracts %j -> %j', (input, expected) => {
    expect(toNationalDigits(input)).toBe(expected)
  })

  it('never returns more than 10 digits', () => {
    expect(toNationalDigits('0532123456789')).toHaveLength(10)
  })
})

describe('formatNationalDigits', () => {
  it.each([
    ['', ''],
    ['5', '+90 5'],
    ['532', '+90 532'],
    ['5321', '+90 532 1'],
    ['532123456', '+90 532 123 45 6'],
    ['5321234567', '+90 532 123 45 67'],
  ])('formats %j progressively as %j', (input, expected) => {
    expect(formatNationalDigits(input)).toBe(expected)
  })
})

describe('normalizeTurkishMobile', () => {
  it('returns the canonical format for complete mobile numbers', () => {
    expect(normalizeTurkishMobile('05321234567')).toBe('+90 532 123 45 67')
    expect(normalizeTurkishMobile('+905321234567')).toBe('+90 532 123 45 67')
  })

  it.each(['0532123456', '053212345678', '02121234567', 'abc', ''])('returns null for %j', (input) => {
    expect(normalizeTurkishMobile(input)).toBeNull()
  })
})

describe('phone mask while typing', () => {
  it('formats a number typed with a leading 0', () => {
    expect(type('05321234567')).toBe('+90 532 123 45 67')
  })

  it('formats a number typed without the leading 0', () => {
    expect(type('5321234567')).toBe('+90 532 123 45 67')
  })

  it('ignores letters, punctuation and extra digits', () => {
    expect(type('0a5b3.2-1(2)3 4!5x6y7')).toBe('+90 532 123 45 67')
    expect(type('053212345678999')).toBe('+90 532 123 45 67')
  })

  it('keeps the partial prefix while it is being typed', () => {
    expect(maskPhoneInput('+', 1).value).toBe('+')
    expect(maskPhoneInput('+9', 2).value).toBe('+9')
    expect(maskPhoneInput('+90', 3).value).toBe('+90')
    expect(maskPhoneInput('0', 1).value).toBe('0')
    expect(type('+905321234567')).toBe('+90 532 123 45 67')
  })

  it('keeps the caret after the digit typed in the middle', () => {
    // "+90 532 123 45 6|7": insert "9" after "+90 53" (caret 6 -> 7)
    const result = maskPhoneInput('+90 539 2 123 45 67', 7)
    expect(result.value).toBe('+90 539 212 34 56')
    expect(result.caret).toBe(7)
  })

  it('moves the caret over the space it skips', () => {
    // typing the 4th digit: "+90 532" + "1" -> "+90 532 1", caret after the "1"
    expect(maskPhoneInput('+90 5321', 8)).toEqual({ value: '+90 532 1', caret: 9 })
  })

  it('cleans pasted text', () => {
    expect(maskPhoneInput('Tel: +90 (532) 123-45-67', 24).value).toBe('+90 532 123 45 67')
  })

  it('leaves only the prefix when the last digit is deleted, so it can be erased normally', () => {
    expect(maskPhoneInput('+90 ', 4).value).toBe('+90')
    expect(maskPhoneInput('+9', 2).value).toBe('+9')
  })
})

describe('client schema with the masked value', () => {
  it('accepts the masked value unchanged', () => {
    expect(clientCreateSchema.parse({ name: 'Atlas', phone: '+90 532 123 45 67' }).phone).toBe('+90 532 123 45 67')
  })

  it('rejects an incomplete masked value with a helpful message', () => {
    const result = clientCreateSchema.safeParse({ name: 'Atlas', phone: '+90 532 123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toContain('05XX XXX XX XX')
  })

  it('keeps the phone optional', () => {
    expect(clientCreateSchema.parse({ name: 'Atlas', phone: '' }).phone).toBeNull()
    expect(clientCreateSchema.parse({ name: 'Atlas', phone: '+90' }).phone).toBeNull()
  })
})
