import { getSearchVariants } from '#shared/utils/search'

/** Builds an OR list of case-insensitive `contains` filters for a text field. */
export function buildTextSearchFilter<Field extends string>(field: Field, search: string) {
  return getSearchVariants(search).map(variant => ({
    [field]: { contains: variant, mode: 'insensitive' as const },
  }) as Record<Field, { contains: string, mode: 'insensitive' }>)
}
