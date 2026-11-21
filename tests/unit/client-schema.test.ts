import { describe, expect, it } from 'vitest'
import { clientCreateSchema, clientListQuerySchema, clientUpdateSchema } from '#shared/schemas/client'
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
      phone: '0532 123 45 67',
      industry: 'Medya',
    })

    expect(result).toEqual({
      name: 'Atlas Medya',
      contactName: 'Ayşe Demir',
      email: 'ayse@atlas.example',
      phone: '+90 532 123 45 67',
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
      .toBe('E-posta adresini ornek@firma.com biçiminde girin.')
  })

  describe('phone', () => {
    const parsePhone = (phone: unknown) => clientCreateSchema.safeParse({ name: 'Atlas', phone })

    it.each([
      ['05321234567', '+90 532 123 45 67'],
      ['+905321234567', '+90 532 123 45 67'],
      ['0532 123 45 67', '+90 532 123 45 67'],
      ['+90 532 123 45 67', '+90 532 123 45 67'],
      ['5321234567', '+90 532 123 45 67'],
      ['+90 (532) 123-45-67', '+90 532 123 45 67'],
      ['0532-123-45-67', '+90 532 123 45 67'],
      ['  0 5 3 2 1 2 3 4 5 6 7  ', '+90 532 123 45 67'],
    ])('accepts %j and stores it as "+90 5XX XXX XX XX"', (input, expected) => {
      const result = parsePhone(input)
      expect(result.success).toBe(true)
      expect(result.data?.phone).toBe(expected)
    })

    it.each([
      ['0532123456', 'too short (10 digits)'],
      ['053212345678', 'too long (12 digits)'],
      ['05454454545454959454', 'far too long'],
      ['+9053212345678', 'too long with country code'],
      ['02121234567', 'landline, not a mobile number'],
      ['abc', 'letters'],
    ])('rejects %j (%s) with a Turkish message', (input) => {
      expect(fieldErrorsOf({ name: 'Atlas', phone: input }).phone).toBe('Telefon numarasını 05XX XXX XX XX biçiminde, 10 haneli cep numarası olarak girin.')
    })

    it.each([[''], ['   '], [null], [undefined]])('treats %j as "no phone" without an error', (input) => {
      const result = parsePhone(input)
      expect(result.success).toBe(true)
      expect(result.data?.phone ?? null).toBeNull()
    })
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

describe('clientUpdateSchema', () => {
  const errorsOf = (input: unknown) => {
    const result = clientUpdateSchema.safeParse(input)
    if (result.success) throw new Error('Expected validation to fail')
    return toFieldErrors(result.error)
  }

  it('accepts a partial update and only returns the sent fields', () => {
    expect(clientUpdateSchema.parse({ contactName: '  Yeni Yetkili ' })).toEqual({ contactName: 'Yeni Yetkili' })
  })

  it('accepts a full update with normalized values', () => {
    expect(clientUpdateSchema.parse({ name: 'Atlas', email: 'a@atlas.example', phone: '0532 123 45 67', industry: '', contactName: '' }))
      .toEqual({ name: 'Atlas', email: 'a@atlas.example', phone: '+90 532 123 45 67', industry: null, contactName: null })
  })

  it('clears optional fields when they are sent empty', () => {
    expect(clientUpdateSchema.parse({ phone: '', email: '  ' })).toEqual({ phone: null, email: null })
  })

  it('keeps the company name required when it is sent', () => {
    expect(errorsOf({ name: '   ' }).name).toBe('Firma adı zorunludur.')
  })

  it('reuses the shared e-mail and phone rules', () => {
    expect(errorsOf({ email: 'yanlis', phone: '05454454545454959454' })).toEqual({
      email: 'E-posta adresini ornek@firma.com biçiminde girin.',
      phone: 'Telefon numarasını 05XX XXX XX XX biçiminde, 10 haneli cep numarası olarak girin.',
    })
  })

  it('rejects an empty update', () => {
    expect(errorsOf({})).toEqual({ _form: 'Güncellenecek en az bir alan gönderiniz.' })
  })
})

describe('industry normalization (Turkish title case)', () => {
  it.each([
    ['yiyecek & içecek', 'Yiyecek & İçecek'],
    ['YİYECEK & İÇECEK', 'Yiyecek & İçecek'],
    ['  inşaat   ve MİMARLIK ', 'İnşaat ve Mimarlık'],
    ['ILAÇ', 'Ilaç'],
    ['ıspanak üreticisi', 'Ispanak Üreticisi'],
    ['istanbul turizm', 'İstanbul Turizm'],
    ['e-ticaret', 'E-Ticaret'],
  ])('stores %j as %j', (input, expected) => {
    expect(clientCreateSchema.parse({ name: 'Atlas', industry: input }).industry).toBe(expected)
  })

  it('keeps an empty industry optional', () => {
    expect(clientCreateSchema.parse({ name: 'Atlas', industry: '  ' }).industry).toBeNull()
  })
})
