import { z } from 'zod'

/** Trims strings and turns empty strings into `null` (for optional form fields). */
export function emptyToNull(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/** Trims strings and turns empty strings into `undefined` (for optional query params). */
export function emptyToUndefined(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

/** Required, trimmed text field with Turkish error messages. */
export function requiredText(label: string, min: number, max: number) {
  return z
    .string({
      error: issue => (issue.input === undefined || issue.input === null
        ? `${label} zorunludur.`
        : `${label} metin olmalıdır.`),
    })
    .trim()
    .min(1, { error: `${label} zorunludur.` })
    .min(min, { error: `${label} en az ${min} karakter olmalıdır.` })
    .max(max, { error: `${label} en fazla ${max} karakter olabilir.` })
}

/** Optional text field: empty values are normalized to `null`. */
export function optionalText(label: string, max: number) {
  return z.preprocess(
    emptyToNull,
    z
      .string({ error: `${label} metin olmalıdır.` })
      .max(max, { error: `${label} en fazla ${max} karakter olabilir.` })
      .nullable()
      .optional(),
  )
}

// Record ids are cuid() values or fixed seed ids (e.g. "seed_client_x").
export const ID_PATTERN = /^[\w-]+$/

export const idSchema = z
  .string({ error: 'Geçersiz kayıt kimliği.' })
  .trim()
  .min(1, { error: 'Geçersiz kayıt kimliği.' })
  .max(64, { error: 'Geçersiz kayıt kimliği.' })
  .regex(ID_PATTERN, { error: 'Geçersiz kayıt kimliği.' })

export const searchSchema = z.preprocess(
  emptyToUndefined,
  z
    .string({ error: 'Arama metni geçersiz.' })
    .max(100, { error: 'Arama metni en fazla 100 karakter olabilir.' })
    .optional(),
)
