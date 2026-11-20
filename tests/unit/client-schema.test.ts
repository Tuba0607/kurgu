import { describe, expect, it } from 'vitest'
import { clientCreateSchema, clientListQuerySchema } from '#shared/schemas/client'
import { toFieldErrors } from '#shared/utils/validation'

function fieldErrorsOf(input: unknown) {
  const result = clientCreateSchema.safeParse(input)
  if (result.success) throw new Error('Expected validation to fail')
  return toFieldErrors(result.error)
}

describe('clientCreateSchema', () => {
  it('accepts a complete, valid client and trims values', () => {
    const result = clientCreateSchema.parse({
      name: '  Atlas Medya  ',
      contactName: 'Ayşe Demir',
      email: 'ayse@atlas.example',
      phone: '+90 (212) 000 00 00',
      industry: 'Medya',
    })

    expect(result).toEqual({
      name: 'Atlas Medya',
      contactName: 'Ayşe Demir',
      email: 'ayse@atlas.example',
      phone: '+90 (212) 000 00 00',
      industry: 'Medya',
    })
  })

  it('accepts only the required name and normalizes empty optionals to null', () => {
    const result = clientCreateSchema.parse({
      name: 'Atlas',
      contactName: '',
      email: '   ',
      phone: '',
      industry: '',
    })

    expect(result).toEqual({ name: 'Atlas', contactName: null, email: null, phone: null, industry: null })
  })

  it('requires a name', () => {
    expect(fieldErrorsOf({})).toEqual({ name: 'Firma adı zorunludur.' })
    expect(fieldErrorsOf({ name: '   ' })).toEqual({ name: 'Firma adı zorunludur.' })
  })

  it('enforces name length limits', () => {
    expect(fieldErrorsOf({ name: 'A' }).name).toBe('Firma adı en az 2 karakter olmalıdır.')
    expect(fieldErrorsOf({ name: 'A'.repeat(121) }).name).toBe('Firma adı en fazla 120 karakter olabilir.')
  })

  it('rejects a non-string name', () => {
    expect(fieldErrorsOf({ name: 42 }).name).toBe('Firma adı metin olmalıdır.')
  })

  it('rejects an invalid email', () => {
    expect(fieldErrorsOf({ name: 'Atlas', email: 'not-an-email' }).email)
      .toBe('Geçerli bir e-posta adresi giriniz.')
  })

  it('rejects an invalid phone number', () => {
    expect(fieldErrorsOf({ name: 'Atlas', phone: 'abc' }).phone)
      .toBe('Geçerli bir telefon numarası giriniz.')
  })

  it('reports every invalid field at once', () => {
    expect(Object.keys(fieldErrorsOf({ name: '', email: 'x', phone: '1' })).sort())
      .toEqual(['email', 'name', 'phone'])
  })
})

describe('clientListQuerySchema', () => {
  it('trims search and drops empty values', () => {
    expect(clientListQuerySchema.parse({ search: '  kahve ' })).toEqual({ search: 'kahve' })
    expect(clientListQuerySchema.parse({ search: '' })).toEqual({ search: undefined })
    expect(clientListQuerySchema.parse({})).toEqual({ search: undefined })
  })

  it('rejects overly long or repeated search params', () => {
    expect(clientListQuerySchema.safeParse({ search: 'x'.repeat(101) }).success).toBe(false)
    expect(clientListQuerySchema.safeParse({ search: ['a', 'b'] }).success).toBe(false)
  })
})
