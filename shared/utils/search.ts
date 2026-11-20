/**
 * PostgreSQL's case-insensitive matching (ILIKE) is not Turkish-aware:
 * "TARIM" lowercases to "tarim" and never matches "Tarım". Searching for both
 * the raw term and its Turkish-locale lowercase form covers dotted/dotless I
 * while keeping plain-ASCII input such as "LINA" working.
 */
export function getSearchVariants(search: string): string[] {
  const turkishLower = search.toLocaleLowerCase('tr-TR')
  return turkishLower === search ? [search] : [search, turkishLower]
}
