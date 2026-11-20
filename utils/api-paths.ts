// Dynamic API paths are returned as plain `string` on purpose: passing template
// literals to Nitro's typed $fetch makes TypeScript resolve route patterns at the
// type level, which is slow and can exceed the compiler's depth limit. Call sites
// pass the response type explicitly instead (e.g. `$fetch<ContentDetail>(...)`).

export function contentApiPath(id: string): string {
  return `/api/contents/${encodeURIComponent(id)}`
}

export function clientApiPath(id: string): string {
  return `/api/clients/${encodeURIComponent(id)}`
}
