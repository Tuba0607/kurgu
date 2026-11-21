import type { Prisma } from '@prisma/client'
import { CONTENT_STATUSES, type ContentSortValue, type ContentStatusValue } from '#shared/constants/content'
import { contentListQuerySchema } from '#shared/schemas/content'

const ORDER_BY: Record<ContentSortValue, Prisma.ContentOrderByWithRelationInput[]> = {
  newest: newestFirst,
  // Contents without a planned date come last.
  scheduled: [{ scheduledAt: { sort: 'asc', nulls: 'last' } }, ...newestFirst],
  // Longest waiting for approval first (the query is limited to IN_REVIEW below).
  waiting: [{ statusChangedAt: 'asc' }, { id: 'asc' }],
}

/**
 * Paginated content list. Filters are optional and combined with AND.
 * `statusCounts` counts every status for the other active filters, so the
 * status tabs can show their numbers.
 */
export default defineEventHandler(async (event) => {
  const { search, status, type, clientId, sort, page, pageSize } = getValidatedQueryParams(event, contentListQuerySchema)

  const baseWhere: Prisma.ContentWhereInput = {
    ...(type && { type }),
    ...(clientId && { clientId }),
    ...(search && { OR: buildTextSearchFilter('title', search) }),
  }
  // "En uzun süredir bekleyen" only makes sense for contents waiting for approval:
  // this sort always lists IN_REVIEW contents, whatever status was requested.
  const effectiveStatus = sort === 'waiting' ? 'IN_REVIEW' : status
  const where: Prisma.ContentWhereInput = { ...baseWhere, ...(effectiveStatus && { status: effectiveStatus }) }

  // Count, page and tab counts are read in one transaction so they always match.
  const [total, items, groups] = await prisma.$transaction([
    prisma.content.count({ where }),
    prisma.content.findMany({
      where,
      select: contentListSelect,
      orderBy: ORDER_BY[sort],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.content.groupBy({ by: ['status'], where: baseWhere, _count: { _all: true }, orderBy: { status: 'asc' } }),
  ])

  const statusCounts = Object.fromEntries(CONTENT_STATUSES.map(value => [value, 0])) as Record<ContentStatusValue, number>
  for (const group of groups) statusCounts[group.status] = (group._count as { _all: number })._all

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    statusCounts,
  }
})
