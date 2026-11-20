import { PrismaClient } from '@prisma/client'

// Reuse a single PrismaClient per process. In development, Nitro hot-reloads
// server modules, so the instance is cached on globalThis to avoid opening a
// new connection pool on every reload. On Vercel each warm function instance
// also reuses this client across invocations.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
