import { clientCreateSchema } from '#shared/schemas/client'

export default defineEventHandler(async (event) => {
  const input = await readValidatedJson(event, clientCreateSchema)

  const client = await prisma.client.create({
    data: input,
    select: clientFieldsSelect,
  })

  setResponseStatus(event, 201, 'Created')
  return { ...client, contentCount: 0 }
})
