import type { FieldErrors } from '#shared/utils/validation'

// Helpers that turn $fetch / useFetch errors into user-facing Turkish messages.
// The server error contract is { statusCode, message, data: { fieldErrors } }.

interface ApiErrorBody {
  message?: string
  data?: { fieldErrors?: FieldErrors }
}

const GENERIC_ERROR = 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'
const NETWORK_ERROR = 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.'

function getErrorBody(error: unknown): ApiErrorBody | undefined {
  if (!error || typeof error !== 'object' || !('data' in error)) return undefined
  const data = (error as { data: unknown }).data
  return data && typeof data === 'object' ? (data as ApiErrorBody) : undefined
}

export function getApiStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('statusCode' in error)) return undefined
  const statusCode = (error as { statusCode: unknown }).statusCode
  return typeof statusCode === 'number' ? statusCode : undefined
}

export function getApiFieldErrors(error: unknown): FieldErrors | null {
  const fieldErrors = getErrorBody(error)?.data?.fieldErrors
  return fieldErrors && Object.keys(fieldErrors).length > 0 ? fieldErrors : null
}

export function getApiErrorMessage(error: unknown): string {
  const statusCode = getApiStatusCode(error)
  if (statusCode === undefined) return NETWORK_ERROR
  if (statusCode >= 500) return GENERIC_ERROR
  return getErrorBody(error)?.message || GENERIC_ERROR
}
