import { CONTENT_STATUS_LABELS, type ContentStatusValue } from '#shared/constants/content'

// Filters of the contents list. Their default value is "empty" (no search,
// all statuses, all clients); anything else counts as an active filter.

export const CONTENT_FILTER_PARAMS = ['search', 'status', 'clientId'] as const
export type ContentFilterParam = (typeof CONTENT_FILTER_PARAMS)[number]

export type ContentFilterState = Record<ContentFilterParam, string>

/** True when at least one filter differs from its default (whitespace-only search is ignored). */
export function hasActiveContentFilters(filters: ContentFilterState): boolean {
  return CONTENT_FILTER_PARAMS.some(param => filters[param].trim() !== '')
}

export interface ActiveFilterChip {
  param: ContentFilterParam
  /** Visible chip text */
  label: string
  /** Accessible name of the chip's remove button */
  removeLabel: string
}

/**
 * Removable chips for the filters applied to the contents list, in the same
 * order as the filter controls (search, client, status). `clientName` resolves
 * the client id; while the client list is loading a neutral label is used.
 */
export function buildActiveFilterChips(filters: ContentFilterState, clientName?: string): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []
  const search = filters.search.trim()

  if (search) {
    chips.push({ param: 'search', label: `Arama: “${search}”`, removeLabel: `“${search}” aramasını kaldır` })
  }
  if (filters.clientId) {
    const name = clientName ?? 'Seçili müşteri'
    chips.push({ param: 'clientId', label: name, removeLabel: `${name} filtresini kaldır` })
  }
  if (filters.status && filters.status in CONTENT_STATUS_LABELS) {
    const label = CONTENT_STATUS_LABELS[filters.status as ContentStatusValue]
    chips.push({ param: 'status', label, removeLabel: `${label} filtresini kaldır` })
  }
  return chips
}

/** Query patch that resets every content filter to its default. */
export function contentFilterResetPatch(): Record<ContentFilterParam, null> {
  return { search: null, status: null, clientId: null }
}

// Status counts and filtering for an already-loaded list of contents
// (used by the client detail page, which filters client-side).

/** '' stands for the "Tümü" (all) tab. */
export type StatusFilterValue = ContentStatusValue | ''

export type ContentStatusCounts = Record<ContentStatusValue, number> & { total: number }

export function countContentsByStatus(contents: ReadonlyArray<{ status: ContentStatusValue }>): ContentStatusCounts {
  const counts: ContentStatusCounts = { total: contents.length, DRAFT: 0, IN_REVIEW: 0, PUBLISHED: 0 }
  for (const content of contents) counts[content.status]++
  return counts
}

/** Returns every content for '' ("Tümü"), otherwise only the contents with that status. */
export function filterContentsByStatus<T extends { status: ContentStatusValue }>(
  contents: ReadonlyArray<T>,
  status: StatusFilterValue,
): T[] {
  return status ? contents.filter(content => content.status === status) : [...contents]
}
