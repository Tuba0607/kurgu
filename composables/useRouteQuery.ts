import { applyQueryPatch, type QueryPatch } from '~/utils/query'

/** Reads a single string query param ('' when absent or repeated). */
export function useRouteQueryValue(name: string) {
  const route = useRoute()
  return computed(() => {
    const value = route.query[name]
    return typeof value === 'string' ? value : ''
  })
}

/**
 * Updates several query params in a single navigation; empty values are removed.
 * `history: 'push'` adds a browser history entry so back/forward step through
 * discrete filter changes; the default 'replace' suits continuous input (typing).
 */
export function useQueryUpdater(options: { history?: 'push' | 'replace' } = {}) {
  const route = useRoute()
  const router = useRouter()
  const navigate = options.history === 'push' ? router.push : router.replace

  return (patch: QueryPatch) => navigate({ query: applyQueryPatch(route.query, patch) })
}

/**
 * Two-way binding between a text input and a query param. The input updates
 * instantly; the URL (and therefore the API request) is debounced.
 */
export function useDebouncedQuerySearch(name = 'search', delay = 300) {
  const applied = useRouteQueryValue(name)
  const updateQuery = useQueryUpdater()
  const input = ref(applied.value)
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(input, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      const trimmed = value.trim()
      if (trimmed !== applied.value) updateQuery({ [name]: trimmed })
    }, delay)
  })

  // Keep the input in sync with browser back/forward and "clear filters".
  watch(applied, (value) => {
    if (value !== input.value.trim()) input.value = value
  })

  onBeforeUnmount(() => clearTimeout(timer))

  return { input, applied }
}
