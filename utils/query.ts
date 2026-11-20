import type { LocationQuery, LocationQueryRaw } from 'vue-router'

export type QueryPatch = Record<string, string | null | undefined>

/**
 * Applies a patch to a route query. Empty values ('' / null / undefined) remove
 * the param; params not mentioned in the patch are kept unchanged.
 */
export function applyQueryPatch(query: LocationQuery | LocationQueryRaw, patch: QueryPatch): LocationQueryRaw {
  const merged: LocationQueryRaw = { ...query, ...patch }
  return Object.fromEntries(
    Object.entries(merged).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )
}
