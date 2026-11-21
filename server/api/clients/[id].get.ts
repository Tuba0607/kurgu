import { CONTENT_STATUSES, type ContentStatusValue } from '#shared/constants/content'

/**
 * Client detail with per-status content counts. The contents themselves are
 * loaded (paginated) from GET /api/contents?clientId=...
 */
export default defineEventHandler(async (event) => {
  const id = getValidatedId(event)

  const client = await prisma.client.findUnique({
    where: { id },
    select: clientFieldsSelect,
  })

  if (!client) {
    throw notFoundError('Müşteri bulunamadı.')
  }

  const groups = await prisma.content.groupBy({
    by: ['status'],
    where: { clientId: id },
    _count: { _all: true },
  })

  // Every status is always present, even when its count is zero.
  const statusCounts = Object.fromEntries(CONTENT_STATUSES.map(status => [status, 0])) as Record<ContentStatusValue, number>
  for (const group of groups) statusCounts[group.status] = group._count._all

  return {
    ...client,
    contentCount: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
    statusCounts,
  }
})
