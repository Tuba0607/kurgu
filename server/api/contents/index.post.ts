import { contentCreateSchema } from '#shared/schemas/content'

const CLIENT_NOT_FOUND = { clientId: 'Seçilen müşteri bulunamadı.' }

export default defineEventHandler(async (event) => {
  const input = await readValidatedJson(event, contentCreateSchema)

  const clientExists = await prisma.client.count({ where: { id: input.clientId } })
  if (!clientExists) {
    throw validationError(CLIENT_NOT_FOUND)
  }

  try {
    const content = await prisma.content.create({
      data: {
        ...input,
        // Platform only applies to social media posts.
        platform: input.type === 'SOCIAL_POST' ? input.platform ?? null : null,
        publishedAt: resolvePublishedAtOnCreate(input.status),
        // The initial status is the first entry of the status history.
        statusChanges: { create: { fromStatus: null, toStatus: input.status } },
      },
      select: contentDetailSelect,
    })

    setResponseStatus(event, 201, 'Created')
    return content
  }
  catch (error) {
    // Client deleted between the check and the insert (foreign key violation).
    if (isPrismaErrorCode(error, 'P2003')) throw validationError(CLIENT_NOT_FOUND)
    throw error
  }
})
