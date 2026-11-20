import { clientListQuerySchema } from '#shared/schemas/client'

export default defineEventHandler(async (event) => {
  const { search } = getValidatedQueryParams(event, clientListQuerySchema)

  const clients = await prisma.client.findMany({
    where: search ? { OR: buildTextSearchFilter('name', search) } : undefined,
    select: {
      ...clientFieldsSelect,
      _count: { select: { contents: true } },
    },
    orderBy: newestFirst,
  })

  return clients.map(({ _count, ...client }) => ({
    ...client,
    contentCount: _count.contents,
  }))
})
