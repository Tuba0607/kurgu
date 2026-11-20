import type { H3Event } from 'h3'
import { Prisma } from '@prisma/client'
import type { z } from 'zod'
import { idSchema } from '#shared/schemas/common'
import { toFieldErrors, type FieldErrors } from '#shared/utils/validation'

/**
 * Error response contract used by every endpoint:
 * { statusCode, statusMessage, message, data?: { fieldErrors } }
 * `message` is user-facing (Turkish); `statusMessage` is the technical reason.
 */

export function badRequestError(message: string, fieldErrors?: FieldErrors) {
  return createError({
    statusCode: 400,
    statusMessage: 'Bad Request',
    message,
    data: fieldErrors ? { fieldErrors } : undefined,
  })
}

export function validationError(fieldErrors: FieldErrors) {
  return createError({
    statusCode: 422,
    statusMessage: 'Unprocessable Entity',
    message: 'Lütfen formdaki hataları düzeltin.',
    data: { fieldErrors },
  })
}

export function notFoundError(message: string) {
  return createError({ statusCode: 404, statusMessage: 'Not Found', message })
}

/** Validates the `:id` route param. Malformed ids return 400. */
export function getValidatedId(event: H3Event, param = 'id'): string {
  const result = idSchema.safeParse(getRouterParam(event, param))
  if (!result.success) {
    throw badRequestError('Geçersiz kayıt kimliği.')
  }
  return result.data
}

/** Validates query params. Invalid filters return 400 with field details. */
export function getValidatedQueryParams<T extends z.ZodType>(event: H3Event, schema: T): z.output<T> {
  const result = schema.safeParse(getQuery(event))
  if (!result.success) {
    throw badRequestError('Geçersiz filtre parametreleri.', toFieldErrors(result.error))
  }
  return result.data
}

/** Reads and validates a JSON body. Malformed JSON returns 400, invalid fields 422. */
export async function readValidatedJson<T extends z.ZodType>(event: H3Event, schema: T): Promise<z.output<T>> {
  let body: unknown
  try {
    body = await readBody(event)
  }
  catch {
    throw badRequestError('İstek gövdesi geçerli bir JSON olmalıdır.')
  }

  if (body !== undefined && (typeof body !== 'object' || body === null || Array.isArray(body))) {
    throw badRequestError('İstek gövdesi bir JSON nesnesi olmalıdır.')
  }

  const result = schema.safeParse(body ?? {})
  if (!result.success) {
    throw validationError(toFieldErrors(result.error))
  }
  return result.data
}

export function isPrismaErrorCode(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
}
