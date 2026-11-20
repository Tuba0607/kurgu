// API response types, derived from the Nitro route handlers so they always
// match the server implementation (dates are serialized as ISO strings).
import type { InternalApi } from 'nitropack'

export type DashboardSummary = InternalApi['/api/dashboard']['get']
export type ClientListItem = InternalApi['/api/clients']['get'][number]
export type ClientDetail = InternalApi['/api/clients/:id']['get']
export type ContentListItem = InternalApi['/api/contents']['get'][number]
export type ContentDetail = InternalApi['/api/contents/:id']['get']
