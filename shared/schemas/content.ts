import { z } from 'zod'
import { CONTENT_STATUSES, CONTENT_TYPES } from '../constants/content'
import { emptyToUndefined, ID_PATTERN, optionalText, requiredText, searchSchema } from './common'

const contentTypeSchema = z.enum(CONTENT_TYPES, {
  error: issue => (issue.input === undefined || issue.input === null
    ? 'İçerik türü zorunludur.'
    : 'Geçerli bir içerik türü seçiniz.'),
})

const contentStatusSchema = z.enum(CONTENT_STATUSES, {
  error: 'Geçerli bir içerik durumu seçiniz.',
})

const clientIdSchema = z
  .string({
    error: issue => (issue.input === undefined || issue.input === null
      ? 'Müşteri seçimi zorunludur.'
      : 'Geçersiz müşteri seçimi.'),
  })
  .trim()
  .min(1, { error: 'Müşteri seçimi zorunludur.' })
  .max(64, { error: 'Geçersiz müşteri seçimi.' })
  .regex(ID_PATTERN, { error: 'Geçersiz müşteri seçimi.' })

// Fields shared by create and update. `status` has no default here so that a
// partial update never silently resets it.
const contentFields = {
  title: requiredText('Başlık', 3, 200),
  body: optionalText('İçerik metni', 20_000),
  type: contentTypeSchema,
  status: contentStatusSchema,
  clientId: clientIdSchema,
}

export const contentCreateSchema = z.object({
  ...contentFields,
  status: contentStatusSchema.default('DRAFT'),
})

export const contentUpdateSchema = z
  .object(contentFields)
  .partial()
  .refine(data => Object.values(data).some(value => value !== undefined), {
    error: 'Güncellenecek en az bir alan gönderiniz.',
  })

export const contentListQuerySchema = z.object({
  search: searchSchema,
  status: z.preprocess(
    emptyToUndefined,
    z.enum(CONTENT_STATUSES, { error: 'Geçersiz içerik durumu filtresi.' }).optional(),
  ),
  clientId: z.preprocess(
    emptyToUndefined,
    z
      .string({ error: 'Geçersiz müşteri filtresi.' })
      .max(64, { error: 'Geçersiz müşteri filtresi.' })
      .regex(ID_PATTERN, { error: 'Geçersiz müşteri filtresi.' })
      .optional(),
  ),
})

export type ContentCreateInput = z.output<typeof contentCreateSchema>
export type ContentUpdateInput = z.output<typeof contentUpdateSchema>
export type ContentListQuery = z.output<typeof contentListQuerySchema>
