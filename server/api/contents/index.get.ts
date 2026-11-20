import type { Prisma } from '@prisma/client'
import { contentListQuerySchema } from '#shared/schemas/content'

export default defineEventHandler(async (event) => {
  const { search, status, clientId } = getValidatedQueryParams(event, contentListQuerySchema)

  // All filters are optional and combined with AND.
  const where: Prisma.ContentWhereInput = {
    ...(status && { status }),
    ...(clientId && { clientId }),
    ...(search && { OR: buildTextSearchFilter('title', search) }),
  }

  return prisma.content.findMany({
    where,
    select: contentListSelect,
    orderBy: newestFirst,
  })
})
