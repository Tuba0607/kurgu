import type { Prisma } from '@prisma/client'
import { contentListQuerySchema } from '#shared/schemas/content'

/** Paginated content list. Filters are optional and combined with AND. */
export default defineEventHandler(async (event) => {
  const { search, status, clientId, page, pageSize } = getValidatedQueryParams(event, contentListQuerySchema)

  const where: Prisma.ContentWhereInput = {
    ...(status && { status }),
    ...(clientId && { clientId }),
    ...(search && { OR: buildTextSearchFilter('title', search) }),
  }

  // Count and page are read in one transaction so they always match.
  const [total, items] = await prisma.$transaction([
    prisma.content.count({ where }),
    prisma.content.findMany({
      where,
      select: contentListSelect,
      orderBy: newestFirst,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
})
