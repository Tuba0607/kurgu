import type { z } from 'zod'

/** Field name -> first error message. `_form` holds errors not tied to a field. */
export type FieldErrors = Record<string, string>

export const FORM_ERROR_KEY = '_form'

/** Converts a ZodError into a flat map of the first message per field. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : FORM_ERROR_KEY
    fieldErrors[key] ??= issue.message
  }
  return fieldErrors
}
