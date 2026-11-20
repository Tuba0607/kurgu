import { contentUpdateSchema } from '#shared/schemas/content'

const CLIENT_NOT_FOUND = { clientId: 'Seçilen müşteri bulunamadı.' }

export default defineEventHandler(async (event) => {
  const id = getValidatedId(event)
  const input = await readValidatedJson(event, contentUpdateSchema)

  try {
    // Read + write in one transaction so publishedAt is derived from the row
    // state that is actually being updated.
    return await prisma.$transaction(async (tx) => {
      const current = await tx.content.findUnique({
        where: { id },
        select: { status: true, publishedAt: true, clientId: true },
      })

      if (!current) {
        throw notFoundError('İçerik bulunamadı.')
      }

      if (input.clientId !== undefined && input.clientId !== current.clientId) {
        const clientExists = await tx.client.count({ where: { id: input.clientId } })
        if (!clientExists) throw validationError(CLIENT_NOT_FOUND)
      }

      const publishedAt = resolvePublishedAtOnUpdate(current, input.status)

      return tx.content.update({
        where: { id },
        data: {
          ...input,
          ...(publishedAt !== undefined && { publishedAt }),
        },
        select: contentDetailSelect,
      })
    })
  }
  catch (error) {
    if (isPrismaErrorCode(error, 'P2025')) throw notFoundError('İçerik bulunamadı.')
    if (isPrismaErrorCode(error, 'P2003')) throw validationError(CLIENT_NOT_FOUND)
    throw error
  }
})
