import { PrismaClient } from '@prisma/client'
import { fetch } from '@nuxt/test-utils/e2e'

/** Prefix for every record created by API tests, used for cleanup. */
export const TEST_MARKER = '__api_test__'

export const testPrisma = new PrismaClient()

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON payloads are asserted field by field
export type Json = any

export interface ApiResponse {
  status: number
  body: Json
}

/** Sends a request to the test server. `rawBody` sends the string as-is (for malformed JSON). */
export async function api(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  options: { body?: unknown, rawBody?: string } = {},
): Promise<ApiResponse> {
  const hasBody = options.body !== undefined || options.rawBody !== undefined
  const response = await fetch(path, {
    method,
    headers: hasBody ? { 'content-type': 'application/json' } : undefined,
    body: options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
  })

  const text = await response.text()
  return { status: response.status, body: text ? JSON.parse(text) : null }
}

/** Removes every record created by API tests (contents first, then their clients). */
export async function cleanupTestRecords(): Promise<void> {
  await testPrisma.content.deleteMany({
    where: {
      OR: [
        { title: { startsWith: TEST_MARKER } },
        { client: { name: { startsWith: TEST_MARKER } } },
      ],
    },
  })
  await testPrisma.client.deleteMany({ where: { name: { startsWith: TEST_MARKER } } })
}

/** Full snapshot of the seeded demo data, used to prove tests do not modify it. */
export async function snapshotSeedData() {
  const [clients, contents] = await Promise.all([
    testPrisma.client.findMany({ where: { id: { startsWith: 'seed_' } }, orderBy: { id: 'asc' } }),
    testPrisma.content.findMany({ where: { id: { startsWith: 'seed_' } }, orderBy: { id: 'asc' } }),
  ])
  return { clients, contents }
}
