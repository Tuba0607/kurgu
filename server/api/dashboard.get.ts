import { CONTENT_STATUSES, type ContentStatusValue, LONG_REVIEW_DAYS } from '#shared/constants/content'

const RECENT_CONTENT_LIMIT = 6
const DAY = 24 * 60 * 60 * 1000

/**
 * Overview data. The action metrics ignore published contents: once a content is
 * live its planned date no longer needs attention.
 */
export default defineEventHandler(async () => {
  const now = new Date()
  const inSevenDays = new Date(now.getTime() + 7 * DAY)
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY)
  const longReviewSince = new Date(now.getTime() - LONG_REVIEW_DAYS * DAY)
  const notPublished = { status: { not: 'PUBLISHED' as const } }

  const [clientCount, statusGroups, recentContents, longReview, dueThisWeek, overdue, addedLastWeek] = await Promise.all([
    prisma.client.count(),
    prisma.content.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.content.findMany({ select: contentListSelect, orderBy: newestFirst, take: RECENT_CONTENT_LIMIT }),
    prisma.content.count({ where: { status: 'IN_REVIEW', statusChangedAt: { lt: longReviewSince } } }),
    prisma.content.count({ where: { ...notPublished, scheduledAt: { gte: now, lt: inSevenDays } } }),
    prisma.content.count({ where: { ...notPublished, scheduledAt: { lt: now } } }),
    prisma.content.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ])

  // Every status is always present, even when its count is zero.
  const statusCounts = Object.fromEntries(CONTENT_STATUSES.map(status => [status, 0])) as Record<ContentStatusValue, number>
  for (const group of statusGroups) statusCounts[group.status] = group._count._all

  return {
    totals: {
      clients: clientCount,
      contents: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
    },
    statusCounts,
    review: { total: statusCounts.IN_REVIEW, longWaiting: longReview },
    schedule: { dueThisWeek, overdue },
    addedLastWeek,
    recentContents,
  }
})
