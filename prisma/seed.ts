/**
 * `npm run db:seed`: resets the database to the demo data (prisma/demo-data.ts).
 *
 * Safety: runs freely on a local database (localhost). On any other host it only
 * runs with ALLOW_DEMO_SEED=1, because it deletes all clients and contents.
 */
import { PrismaClient } from '@prisma/client'
import { resetDemoData } from './demo-data'

function assertSeedAllowed() {
  const url = process.env.DATABASE_URL ?? ''
  const host = url.match(/@([^:/?]+)/)?.[1] ?? ''
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(host)
  if (!isLocal && process.env.ALLOW_DEMO_SEED !== '1') {
    throw new Error(`Seed deletes all data. It runs on a remote database (host: "${host || 'unknown'}") only with ALLOW_DEMO_SEED=1.`)
  }
}

async function main() {
  assertSeedAllowed()
  const prisma = new PrismaClient()
  try {
    const { clients, contents } = await resetDemoData(prisma)
    console.log(`Seed tamamlandı: ${clients} müşteri, ${contents} içerik.`)
  }
  finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
