export type PageItem = number | 'ellipsis'

/**
 * Page numbers to render: all pages when there are few, otherwise the first and
 * last page, the current page with one neighbour on each side, and ellipses.
 * e.g. (5, 10) -> [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]
 */
export function getPageItems(current: number, totalPages: number, maxVisible = 7): PageItem[] {
  if (totalPages <= maxVisible) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const pages = new Set([1, totalPages, current - 1, current, current + 1])
  // Near the edges show a few more pages instead of a lone ellipsis.
  if (current <= 3) [2, 3, 4].forEach(page => pages.add(page))
  if (current >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach(page => pages.add(page))

  const sorted = [...pages].filter(page => page >= 1 && page <= totalPages).sort((a, b) => a - b)
  const items: PageItem[] = []
  sorted.forEach((page, index) => {
    const gap = index > 0 ? page - sorted[index - 1]! : 1
    // A single hidden page is shown as a number: an ellipsis would take the same space.
    if (gap === 2) items.push(page - 1)
    else if (gap > 2) items.push('ellipsis')
    items.push(page)
  })
  return items
}

/** "1–10 / 17" style range of the items shown on the current page. */
export function getPageRange(page: number, pageSize: number, total: number): { from: number, to: number } {
  if (total === 0) return { from: 0, to: 0 }
  const from = (page - 1) * pageSize + 1
  return { from: Math.min(from, total), to: Math.min(page * pageSize, total) }
}

/** Reads a positive page number from a query value; anything else means page 1. */
export function parsePageParam(value: string): number {
  return /^[1-9]\d*$/.test(value) ? Number(value) : 1
}
