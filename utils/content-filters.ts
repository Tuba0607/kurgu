import { QUERY_KEYS } from '#shared/constants/routes'
import { CONTENT_STATUS_LABELS, CONTENT_TYPE_LABELS, type ContentStatusValue, type ContentTypeValue } from '#shared/constants/content'

// Filters of the contents list. Their default value is "empty" (no search,
// all statuses, all clients); anything else counts as an active filter.

export const CONTENT_FILTER_PARAMS = ['search', 'status', 'clientId', 'type'] as const
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
  if (filters.type && filters.type in CONTENT_TYPE_LABELS) {
    const label = CONTENT_TYPE_LABELS[filters.type as ContentTypeValue]
    chips.push({ param: 'type', label, removeLabel: `${label} filtresini kaldır` })
  }
  if (filters.status && filters.status in CONTENT_STATUS_LABELS) {
    const label = CONTENT_STATUS_LABELS[filters.status as ContentStatusValue]
    chips.push({ param: 'status', label, removeLabel: `${label} filtresini kaldır` })
  }
  return chips
}

/** Query patch that resets every content filter to its default (and the page back to 1). */
export function contentFilterResetPatch(): Record<string, null> {
  const { search, status, clientId, type, page } = QUERY_KEYS
  return { [search]: null, [status]: null, [clientId]: null, [type]: null, [page]: null }
}

/** '' stands for the "Tümü" (all) tab. */
export type StatusFilterValue = ContentStatusValue | ''
