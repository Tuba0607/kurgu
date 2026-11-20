import type { Prisma } from '@prisma/client'

// Shared Prisma `select` shapes so every endpoint returns the same fields.

export const clientSummarySelect = {
  id: true,
  name: true,
} satisfies Prisma.ClientSelect

export const clientFieldsSelect = {
  id: true,
  name: true,
  contactName: true,
  email: true,
  phone: true,
  industry: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientSelect

/** Content fields for lists (body is omitted to keep payloads small). */
export const contentListSelect = {
  id: true,
  title: true,
  type: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  client: { select: clientSummarySelect },
} satisfies Prisma.ContentSelect

export const contentDetailSelect = {
  ...contentListSelect,
  body: true,
  clientId: true,
} satisfies Prisma.ContentSelect

/** Deterministic newest-first ordering, usable for both clients and contents. */
export const newestFirst = [
  { createdAt: 'desc' as const },
  { id: 'desc' as const },
]
