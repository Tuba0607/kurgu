export default defineEventHandler(async (event) => {
  const id = getValidatedId(event)

  const content = await prisma.content.findUnique({
    where: { id },
    select: contentDetailSelect,
  })

  if (!content) {
    throw notFoundError('İçerik bulunamadı.')
  }

  return content
})
