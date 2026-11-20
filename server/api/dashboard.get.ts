import { CONTENT_STATUSES, type ContentStatusValue } from '#shared/constants/content'

const RECENT_CONTENT_LIMIT = 6

export default defineEventHandler(async () => {
  const [clientCount, statusGroups, recentContents] = await Promise.all([
    prisma.client.count(),
    prisma.content.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.content.findMany({
      select: contentListSelect,
      orderBy: newestFirst,
      take: RECENT_CONTENT_LIMIT,
    }),
  ])

  // Every status is always present, even when its count is zero.
  const statusCounts = Object.fromEntries(
    CONTENT_STATUSES.map(status => [status, 0]),
  ) as Record<ContentStatusValue, number>

  for (const group of statusGroups) {
    statusCounts[group.status] = group._count._all
  }

  const contentCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0)

  return {
    totals: {
      clients: clientCount,
      contents: contentCount,
    },
    statusCounts,
    recentContents,
  }
})
