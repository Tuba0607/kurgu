export default defineEventHandler(async (event) => {
  const id = getValidatedId(event)

  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      ...clientFieldsSelect,
      contents: {
        select: contentListSelect,
        orderBy: newestFirst,
      },
    },
  })

  if (!client) {
    throw notFoundError('Müşteri bulunamadı.')
  }

  return client
})
