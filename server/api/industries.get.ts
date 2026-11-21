/** Distinct industries already used by clients, for the industry combobox suggestions. */
export default defineEventHandler(async () => {
  const rows = await prisma.client.findMany({
    where: { industry: { not: null } },
    select: { industry: true },
    distinct: ['industry'],
  })

  return rows
    .map(row => row.industry!)
    .sort((a, b) => a.localeCompare(b, 'tr-TR'))
})
