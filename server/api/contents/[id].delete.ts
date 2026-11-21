/** Deletes a content (its status history is removed by cascade). */
export default defineEventHandler(async (event) => {
  const id = getValidatedId(event)
  try {
    await prisma.content.delete({ where: { id } })
  }
  catch (error) {
    if (isPrismaErrorCode(error, 'P2025')) throw notFoundError('İçerik bulunamadı.')
    throw error
  }
  setResponseStatus(event, 204, 'No Content')
  return null
})
