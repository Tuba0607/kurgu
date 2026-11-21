import { z } from 'zod'
import { normalizeTurkishMobile } from '../utils/phone'
import { toTurkishTitleCase } from '../utils/text'
import { emptyToNull, optionalText, requiredText, searchSchema } from './common'

// Turkish mobile numbers are stored in one canonical format: "+90 5XX XXX XX XX".
const PHONE_PATTERN = /^\+90 5\d{2} \d{3} \d{2} \d{2}$/
const PHONE_ERROR = 'Telefon numarasını 05XX XXX XX XX biçiminde, 10 haneli cep numarası olarak girin.'

/**
 * Normalizes any accepted spelling ("0532 123 45 67", "+905321234567", "532 123 45 67")
 * to "+90 532 123 45 67". Empty -> null; invalid input is passed through unchanged so
 * the pattern check reports it.
 */
export function normalizePhone(value: unknown): unknown {
  if (typeof value !== 'string') return value
  // Empty, or only the mask prefix left over ("+90") -> no phone.
  if (/^\s*(?:\+\s*9?\s*0?)?\s*$/.test(value)) return null
  return normalizeTurkishMobile(value) ?? value
}

export const clientCreateSchema = z.object({
  name: requiredText('Firma adı', 2, 120),
  contactName: optionalText('Yetkili adı', 120),
  email: z.preprocess(
    emptyToNull,
    z
      .email({ error: 'E-posta adresini ornek@firma.com biçiminde girin.' })
      .max(254, { error: 'E-posta adresi en fazla 254 karakter olabilir.' })
      .nullable()
      .optional(),
  ),
  phone: z.preprocess(
    normalizePhone,
    z
      .string({ error: PHONE_ERROR })
      .regex(PHONE_PATTERN, { error: PHONE_ERROR })
      .nullable()
      .optional(),
  ),
  // Stored in Turkish title case so the same industry is never saved twice
  // with different casing ("yiyecek & içecek" -> "Yiyecek & İçecek").
  industry: z.preprocess(
    value => (typeof value === 'string' && value.trim() ? toTurkishTitleCase(value) : value),
    optionalText('Sektör', 80),
  ),
})

/**
 * Partial update: only the sent fields change. Uses exactly the same field rules
 * as creation (required non-empty name if sent, shared e-mail/phone validation);
 * empty optional values clear the field (null).
 */
export const clientUpdateSchema = clientCreateSchema
  .partial()
  .refine(data => Object.values(data).some(value => value !== undefined), {
    error: 'Güncellenecek en az bir alan gönderiniz.',
  })

export const clientListQuerySchema = z.object({
  search: searchSchema,
})

export type ClientCreateInput = z.output<typeof clientCreateSchema>
export type ClientUpdateInput = z.output<typeof clientUpdateSchema>
export type ClientListQuery = z.output<typeof clientListQuerySchema>
