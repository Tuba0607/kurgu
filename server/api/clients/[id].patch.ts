import { clientUpdateSchema } from '#shared/schemas/client'

/**
 * Updates a client's own fields only. Related contents are not part of the
 * update payload and are never modified or removed.
 */
export default defineEventHandler(async (event) => {
  const id = getValidatedId(event)
  const input = await readValidatedJson(event, clientUpdateSchema)

  try {
    const { _count, ...client } = await prisma.client.update({
      where: { id },
      data: input,
      select: {
        ...clientFieldsSelect,
        _count: { select: { contents: true } },
      },
    })
    return { ...client, contentCount: _count.contents }
  }
  catch (error) {
    if (isPrismaErrorCode(error, 'P2025')) throw notFoundError('Müşteri bulunamadı.')
    throw error
  }
})
