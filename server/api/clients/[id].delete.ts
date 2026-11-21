/**
 * Deletes a client together with all of its contents (cascade). The UI asks for
 * confirmation and shows how many contents will be deleted.
 */
export default defineEventHandler(async (event) => {
  const id = getValidatedId(event)
  try {
    const [deletedContents] = await prisma.$transaction([
      prisma.content.count({ where: { clientId: id } }),
      prisma.client.delete({ where: { id } }),
    ])
    return { deletedContents }
  }
  catch (error) {
    if (isPrismaErrorCode(error, 'P2025')) throw notFoundError('Müşteri bulunamadı.')
    throw error
  }
})
