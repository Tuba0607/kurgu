import { describe, expect, it } from 'vitest'
import {
  contentCreateSchema,
  contentListQuerySchema,
  contentUpdateSchema,
} from '#shared/schemas/content'
import { toFieldErrors } from '#shared/utils/validation'

const validContent = {
  title: 'Yeni kampanya gönderisi',
  body: 'Kampanya metni',
  type: 'SOCIAL_POST',
  status: 'IN_REVIEW',
  clientId: 'seed_client_lina_kozmetik',
}

describe('contentCreateSchema', () => {
  it('accepts a valid content', () => {
    expect(contentCreateSchema.parse(validContent)).toEqual(validContent)
  })

  it('defaults status to DRAFT and normalizes an empty body to null', () => {
    const { status: _status, ...withoutStatus } = validContent
    const result = contentCreateSchema.parse({ ...withoutStatus, body: '  ' })

    expect(result.status).toBe('DRAFT')
    expect(result.body).toBeNull()
  })

  it('reports Turkish messages for missing required fields', () => {
    const result = contentCreateSchema.safeParse({})
    expect(result.success).toBe(false)
    expect(toFieldErrors(result.error!)).toEqual({
      title: 'Başlık zorunludur.',
      type: 'İçerik türü zorunludur.',
      clientId: 'Müşteri seçimi zorunludur.',
    })
  })

  it('rejects unknown type and status values', () => {
    const result = contentCreateSchema.safeParse({ ...validContent, type: 'VIDEO', status: 'ARCHIVED' })
    const errors = toFieldErrors(result.error!)

    expect(errors.type).toBe('Geçerli bir içerik türü seçiniz.')
    expect(errors.status).toBe('Geçerli bir içerik durumu seçiniz.')
  })

  it('enforces title length limits', () => {
    expect(toFieldErrors(contentCreateSchema.safeParse({ ...validContent, title: ' a ' }).error!).title)
      .toBe('Başlık en az 2 karakter olmalıdır.')
    expect(toFieldErrors(contentCreateSchema.safeParse({ ...validContent, title: 'a'.repeat(201) }).error!).title)
      .toBe('Başlık en fazla 200 karakter olabilir.')
  })

  it('rejects a malformed client id', () => {
    const result = contentCreateSchema.safeParse({ ...validContent, clientId: 'bad id;' })
    expect(toFieldErrors(result.error!).clientId).toBe('Geçersiz müşteri seçimi.')
  })

  it('ignores server-managed fields such as publishedAt', () => {
    const result = contentCreateSchema.parse({ ...validContent, publishedAt: '2020-01-01' })
    expect(result).not.toHaveProperty('publishedAt')
  })
})

describe('contentUpdateSchema', () => {
  it('accepts a partial update without injecting a default status', () => {
    const result = contentUpdateSchema.parse({ title: 'Güncel başlık' })
    expect(result).toEqual({ title: 'Güncel başlık' })
    expect(result).not.toHaveProperty('status')
  })

  it('allows clearing the body', () => {
    expect(contentUpdateSchema.parse({ body: '' })).toEqual({ body: null })
  })

  it('rejects an empty update', () => {
    const result = contentUpdateSchema.safeParse({})
    expect(toFieldErrors(result.error!)).toEqual({ _form: 'Güncellenecek en az bir alan gönderiniz.' })
  })

  it('rejects an update that only contains unknown fields', () => {
    expect(contentUpdateSchema.safeParse({ publishedAt: '2020-01-01' }).success).toBe(false)
  })

  it('still validates provided fields', () => {
    const result = contentUpdateSchema.safeParse({ title: 'x', status: 'DONE' })
    expect(Object.keys(toFieldErrors(result.error!)).sort()).toEqual(['status', 'title'])
  })
})

describe('contentListQuerySchema', () => {
  it('accepts combined filters', () => {
    expect(contentListQuerySchema.parse({ search: ' blog ', status: 'PUBLISHED', clientId: 'seed_client_mavi_rota' }))
      .toEqual({ search: 'blog', status: 'PUBLISHED', clientId: 'seed_client_mavi_rota', page: 1, pageSize: 10, sort: 'newest' })
  })

  it('treats empty filter values as absent', () => {
    expect(contentListQuerySchema.parse({ search: '', status: '', clientId: '' }))
      .toEqual({ search: undefined, status: undefined, clientId: undefined, page: 1, pageSize: 10, sort: 'newest' })
  })

  it('rejects invalid filter values', () => {
    const result = contentListQuerySchema.safeParse({ status: 'ARCHIVED', clientId: 'x y' })
    expect(toFieldErrors(result.error!)).toEqual({
      status: 'Geçersiz içerik durumu filtresi.',
      clientId: 'Geçersiz müşteri filtresi.',
    })
  })
})
