import type { Prisma } from '@prisma/client'
import { CONTENT_STATUSES, type ContentStatusValue } from '#shared/constants/content'
import { type ClientSortValue, clientListQuerySchema } from '#shared/schemas/client'

const ORDER_BY: Record<ClientSortValue, Prisma.ClientOrderByWithRelationInput[]> = {
  newest: newestFirst,
  name: [{ name: 'asc' }, { id: 'asc' }],
  contents: [{ contents: { _count: 'desc' } }, { name: 'asc' }],
}

/** Client list with content counts per status (for the distribution bar). */
export default defineEventHandler(async (event) => {
  const { search, sort } = getValidatedQueryParams(event, clientListQuerySchema)

  const clients = await prisma.client.findMany({
    where: search ? { OR: buildTextSearchFilter('name', search) } : undefined,
    select: clientFieldsSelect,
    orderBy: ORDER_BY[sort],
  })

  // The database collation is not Turkish-aware ("Ç", "İ", "Ş"...): sort names in JS.
  if (sort === 'name') clients.sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'))

  const groups = await prisma.content.groupBy({
    by: ['clientId', 'status'],
    where: { clientId: { in: clients.map(client => client.id) } },
    _count: { _all: true },
  })

  return clients.map((client) => {
    const statusCounts = Object.fromEntries(CONTENT_STATUSES.map(status => [status, 0])) as Record<ContentStatusValue, number>
    for (const group of groups) {
      if (group.clientId === client.id) statusCounts[group.status] = group._count._all
    }
    return {
      ...client,
      contentCount: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
      statusCounts,
    }
  })
})
