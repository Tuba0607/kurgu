import { z } from 'zod'
import { emptyToNull, optionalText, requiredText, searchSchema } from './common'

const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/

export const clientCreateSchema = z.object({
  name: requiredText('Firma adı', 2, 120),
  contactName: optionalText('Yetkili adı', 120),
  email: z.preprocess(
    emptyToNull,
    z
      .email({ error: 'Geçerli bir e-posta adresi giriniz.' })
      .max(254, { error: 'E-posta adresi en fazla 254 karakter olabilir.' })
      .nullable()
      .optional(),
  ),
  phone: z.preprocess(
    emptyToNull,
    z
      .string({ error: 'Telefon numarası metin olmalıdır.' })
      .regex(PHONE_PATTERN, { error: 'Geçerli bir telefon numarası giriniz.' })
      .nullable()
      .optional(),
  ),
  industry: optionalText('Sektör', 80),
})

export const clientListQuerySchema = z.object({
  search: searchSchema,
})

export type ClientCreateInput = z.output<typeof clientCreateSchema>
export type ClientListQuery = z.output<typeof clientListQuerySchema>
