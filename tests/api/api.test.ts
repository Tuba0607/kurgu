import { fileURLToPath } from 'node:url'
import { setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  api,
  cleanupTestRecords,
  type Json,
  snapshotSeedData,
  TEST_MARKER,
  testPrisma,
} from './helpers'

const LINA = 'seed_client_lina_kozmetik'
const MAVI_ROTA = 'seed_client_mavi_rota'

let seedSnapshot: Awaited<ReturnType<typeof snapshotSeedData>>
let countsBefore: { clients: number, contents: number }

beforeAll(async () => {
  await cleanupTestRecords() // leftovers from an interrupted run
  seedSnapshot = await snapshotSeedData()
  countsBefore = { clients: await testPrisma.client.count(), contents: await testPrisma.content.count() }
})

afterAll(async () => {
  await cleanupTestRecords()

  // Demo data must be byte-for-byte unchanged and no temporary rows may remain.
  expect(await snapshotSeedData()).toEqual(seedSnapshot)
  expect(await testPrisma.client.count()).toBe(countsBefore.clients)
  expect(await testPrisma.content.count()).toBe(countsBefore.contents)

  await testPrisma.$disconnect()
})

await setup({
  rootDir: fileURLToPath(new URL('../..', import.meta.url)),
  server: true,
  browser: false,
})

async function createTestClient(overrides: Record<string, unknown> = {}): Promise<Json> {
  const { status, body } = await api('POST', '/api/clients', {
    body: { name: `${TEST_MARKER} Client ${crypto.randomUUID()}`, ...overrides },
  })
  expect(status).toBe(201)
  return body
}

async function createTestContent(clientId: string, overrides: Record<string, unknown> = {}): Promise<Json> {
  const { status, body } = await api('POST', '/api/contents', {
    body: { title: `${TEST_MARKER} Content`, type: 'BLOG_POST', clientId, ...overrides },
  })
  expect(status).toBe(201)
  return body
}

/** Memoizes an async factory so the record is created once per describe block. */
function once<T>(factory: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | undefined
  return () => (promise ??= factory())
}

function expectSortedNewestFirst(items: Json[]): void {
  const timestamps = items.map(item => new Date(item.createdAt).getTime())
  expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a))
}

describe('GET /api/dashboard', () => {
  it('returns totals, per-status counts and recent contents', async () => {
    const { status, body } = await api('GET', '/api/dashboard')

    expect(status).toBe(200)
    expect(body.totals).toEqual({ clients: countsBefore.clients, contents: countsBefore.contents })
    expect(Object.keys(body.statusCounts).sort()).toEqual(['DRAFT', 'IN_REVIEW', 'PUBLISHED'])

    const statusTotal = Object.values<number>(body.statusCounts).reduce((sum, count) => sum + count, 0)
    expect(statusTotal).toBe(body.totals.contents)

    expect(body.recentContents.length).toBeLessThanOrEqual(6)
    expectSortedNewestFirst(body.recentContents)
    expect(body.recentContents[0].client).toEqual({ id: expect.any(String), name: expect.any(String) })
  })

  it('matches the seeded status distribution', async () => {
    const { body } = await api('GET', '/api/dashboard')
    const expected = await testPrisma.content.groupBy({ by: ['status'], _count: { _all: true } })

    for (const group of expected) {
      expect(body.statusCounts[group.status]).toBe(group._count._all)
    }
  })
})

describe('Clients API', () => {
  it('lists clients with their content count', async () => {
    const { status, body } = await api('GET', '/api/clients')

    expect(status).toBe(200)
    expect(body).toHaveLength(countsBefore.clients)
    expect(body.find((client: Json) => client.id === LINA)).toMatchObject({ name: 'Lina Kozmetik', contentCount: 3 })
    expectSortedNewestFirst(body)
  })

  it('searches by company name, case-insensitively', async () => {
    for (const search of ['kahve', 'KAHVE', ' Kahve ']) {
      const { status, body } = await api('GET', `/api/clients?search=${encodeURIComponent(search)}`)
      expect(status).toBe(200)
      expect(body.map((client: Json) => client.name)).toEqual(['Anadolu Kahve Evi'])
    }
  })

  it('handles Turkish dotted and dotless I in searches', async () => {
    const cases: Array<[string, string]> = [
      ['TARIM', 'Ekin Organik Tarım'],
      ['YAPI', 'Kuzey Yapı Mimarlık'],
      ['LİNA', 'Lina Kozmetik'],
      ['LINA', 'Lina Kozmetik'],
    ]

    for (const [search, expected] of cases) {
      const { body } = await api('GET', `/api/clients?search=${encodeURIComponent(search)}`)
      expect(body.map((client: Json) => client.name), search).toEqual([expected])
    }
  })

  it('returns an empty list when nothing matches', async () => {
    const { status, body } = await api('GET', '/api/clients?search=zzz-no-match')
    expect(status).toBe(200)
    expect(body).toEqual([])
  })

  it('rejects an invalid search filter with 400', async () => {
    const { status, body } = await api('GET', `/api/clients?search=${'x'.repeat(101)}`)
    expect(status).toBe(400)
    expect(body.message).toBe('Geçersiz filtre parametreleri.')
    expect(body.data.fieldErrors.search).toBe('Arama metni en fazla 100 karakter olabilir.')
  })

  it('creates a client (201) with trimmed values and null optionals', async () => {
    const name = `${TEST_MARKER} Atlas Medya`
    const { status, body } = await api('POST', '/api/clients', {
      body: { name: `  ${name}  `, email: 'info@atlas.example', phone: '', industry: '  Medya ' },
    })

    expect(status).toBe(201)
    expect(body).toMatchObject({
      name,
      email: 'info@atlas.example',
      contactName: null,
      phone: null,
      industry: 'Medya',
      contentCount: 0,
    })

    const list = await api('GET', `/api/clients?search=${encodeURIComponent('Atlas Medya')}`)
    expect(list.body.map((client: Json) => client.id)).toContain(body.id)
  })

  it('rejects invalid client data with 422 and Turkish field errors', async () => {
    const { status, body } = await api('POST', '/api/clients', { body: { name: 'A', email: 'nope' } })

    expect(status).toBe(422)
    expect(body.message).toBe('Lütfen formdaki hataları düzeltin.')
    expect(body.data.fieldErrors).toEqual({
      name: 'Firma adı en az 2 karakter olmalıdır.',
      email: 'Geçerli bir e-posta adresi giriniz.',
    })
  })

  it('rejects a missing body with 422', async () => {
    const { status, body } = await api('POST', '/api/clients')
    expect(status).toBe(422)
    expect(body.data.fieldErrors.name).toBe('Firma adı zorunludur.')
  })

  it('rejects malformed JSON and non-object bodies with 400', async () => {
    const malformed = await api('POST', '/api/clients', { rawBody: '{"name": ' })
    expect(malformed.status).toBe(400)
    expect(malformed.body.message).toBe('İstek gövdesi geçerli bir JSON olmalıdır.')

    const array = await api('POST', '/api/clients', { body: [{ name: 'Atlas' }] })
    expect(array.status).toBe(400)
    expect(array.body.message).toBe('İstek gövdesi bir JSON nesnesi olmalıdır.')
  })

  it('returns a client with its contents, newest first', async () => {
    const { status, body } = await api('GET', `/api/clients/${LINA}`)

    expect(status).toBe(200)
    expect(body).toMatchObject({ id: LINA, name: 'Lina Kozmetik' })
    expect(body.contents).toHaveLength(3)
    expect(body.contents.every((content: Json) => content.client.id === LINA)).toBe(true)
    expectSortedNewestFirst(body.contents)
  })

  it('returns 404 for an unknown client', async () => {
    const { status, body } = await api('GET', '/api/clients/cl_does_not_exist')
    expect(status).toBe(404)
    expect(body.message).toBe('Müşteri bulunamadı.')
  })

  it('returns 400 for a malformed client id', async () => {
    const { status, body } = await api('GET', '/api/clients/bad$id')
    expect(status).toBe(400)
    expect(body.message).toBe('Geçersiz kayıt kimliği.')
  })
})

describe('Contents API: listing and filters', () => {
  it('lists all contents newest first without the body field', async () => {
    const { status, body } = await api('GET', '/api/contents')

    expect(status).toBe(200)
    expect(body).toHaveLength(countsBefore.contents)
    expect(body[0]).not.toHaveProperty('body')
    expect(body[0].client).toEqual({ id: expect.any(String), name: expect.any(String) })
    expectSortedNewestFirst(body)
  })

  it('filters by status', async () => {
    const { body } = await api('GET', '/api/contents?status=PUBLISHED')
    expect(body.length).toBeGreaterThan(0)
    expect(body.every((content: Json) => content.status === 'PUBLISHED')).toBe(true)
  })

  it('filters by client', async () => {
    const { body } = await api('GET', `/api/contents?clientId=${LINA}`)
    expect(body).toHaveLength(3)
    expect(body.every((content: Json) => content.client.id === LINA)).toBe(true)
  })

  it('searches by title, case-insensitively', async () => {
    const { body } = await api('GET', '/api/contents?search=REHBER')
    expect(body.map((content: Json) => content.title)).toEqual(['Cilt tipine göre bakım rehberi'])
  })

  it('combines search, status and client filters', async () => {
    const byClientAndStatus = await api('GET', `/api/contents?clientId=${MAVI_ROTA}&status=PUBLISHED`)
    expect(byClientAndStatus.body).toHaveLength(2)

    const allThree = await api('GET', `/api/contents?clientId=${MAVI_ROTA}&status=PUBLISHED&search=koy`)
    expect(allThree.body.map((content: Json) => content.title)).toEqual(['Ege’de keşfedilmemiş 7 koy'])

    const noMatch = await api('GET', `/api/contents?clientId=${MAVI_ROTA}&status=DRAFT`)
    expect(noMatch.body).toEqual([])
  })

  it('treats empty filter values as no filter', async () => {
    const { status, body } = await api('GET', '/api/contents?status=&clientId=&search=')
    expect(status).toBe(200)
    expect(body).toHaveLength(countsBefore.contents)
  })

  it('returns an empty list for a well-formed but unknown client id', async () => {
    const { status, body } = await api('GET', '/api/contents?clientId=cl_does_not_exist')
    expect(status).toBe(200)
    expect(body).toEqual([])
  })

  it('rejects invalid filters with 400', async () => {
    const { status, body } = await api('GET', '/api/contents?status=ARCHIVED&clientId=bad$id')
    expect(status).toBe(400)
    expect(body.data.fieldErrors).toEqual({
      status: 'Geçersiz içerik durumu filtresi.',
      clientId: 'Geçersiz müşteri filtresi.',
    })
  })
})

describe('Contents API: create and read', () => {
  // Created lazily inside tests: the test server context is not available in nested hooks.
  const getTestClient = once(() => createTestClient())

  it('creates a draft by default with publishedAt null', async () => {
    const testClient = await getTestClient()
    const { status, body } = await api('POST', '/api/contents', {
      body: { title: `${TEST_MARKER} Taslak yazı`, type: 'BLOG_POST', clientId: testClient.id, body: 'Metin' },
    })

    expect(status).toBe(201)
    expect(body).toMatchObject({
      status: 'DRAFT',
      publishedAt: null,
      body: 'Metin',
      clientId: testClient.id,
      client: { id: testClient.id, name: testClient.name },
    })
  })

  it('sets publishedAt when created as PUBLISHED', async () => {
    const testClient = await getTestClient()
    const before = Date.now()
    const content = await createTestContent(testClient.id, { status: 'PUBLISHED' })

    expect(content.status).toBe('PUBLISHED')
    expect(new Date(content.publishedAt).getTime()).toBeGreaterThanOrEqual(before - 1000)
  })

  it('ignores a client-supplied publishedAt', async () => {
    const testClient = await getTestClient()
    const content = await createTestContent(testClient.id, { status: 'DRAFT', publishedAt: '2020-01-01T00:00:00.000Z' })
    expect(content.publishedAt).toBeNull()
  })

  it('rejects an unknown client with 422', async () => {
    const { status, body } = await api('POST', '/api/contents', {
      body: { title: `${TEST_MARKER} Orphan`, type: 'WEB_PAGE', clientId: 'cl_does_not_exist' },
    })
    expect(status).toBe(422)
    expect(body.data.fieldErrors).toEqual({ clientId: 'Seçilen müşteri bulunamadı.' })
  })

  it('rejects invalid content data with 422', async () => {
    const testClient = await getTestClient()
    const { status, body } = await api('POST', '/api/contents', {
      body: { title: 'ab', type: 'VIDEO', status: 'DONE', clientId: testClient.id },
    })
    expect(status).toBe(422)
    expect(body.data.fieldErrors).toEqual({
      title: 'Başlık en az 3 karakter olmalıdır.',
      type: 'Geçerli bir içerik türü seçiniz.',
      status: 'Geçerli bir içerik durumu seçiniz.',
    })
  })

  it('returns a single content with body and client', async () => {
    const testClient = await getTestClient()
    const created = await createTestContent(testClient.id, { body: 'Detay metni' })
    const { status, body } = await api('GET', `/api/contents/${created.id}`)

    expect(status).toBe(200)
    expect(body).toMatchObject({ id: created.id, body: 'Detay metni', client: { id: testClient.id } })
  })

  it('returns 404 / 400 for unknown or malformed content ids', async () => {
    const missing = await api('GET', '/api/contents/ct_does_not_exist')
    expect(missing.status).toBe(404)
    expect(missing.body.message).toBe('İçerik bulunamadı.')

    const malformed = await api('GET', '/api/contents/bad$id')
    expect(malformed.status).toBe(400)
  })
})

describe('Contents API: update and publishedAt lifecycle', () => {
  const getTestClient = once(() => createTestClient())
  const getOtherClient = once(() => createTestClient())

  it('manages publishedAt across status changes', async () => {
    const testClient = await getTestClient()
    const content = await createTestContent(testClient.id)
    expect(content.publishedAt).toBeNull()

    // First publish -> publishedAt is set.
    const published = await api('PATCH', `/api/contents/${content.id}`, { body: { status: 'PUBLISHED' } })
    expect(published.status).toBe(200)
    const firstPublishedAt = published.body.publishedAt
    expect(firstPublishedAt).not.toBeNull()

    // Updating another field keeps the original publishedAt.
    const renamed = await api('PATCH', `/api/contents/${content.id}`, { body: { title: `${TEST_MARKER} Yeni başlık` } })
    expect(renamed.body).toMatchObject({ title: `${TEST_MARKER} Yeni başlık`, status: 'PUBLISHED', publishedAt: firstPublishedAt })

    // Re-sending PUBLISHED keeps the original publishedAt as well.
    const republished = await api('PATCH', `/api/contents/${content.id}`, { body: { status: 'PUBLISHED' } })
    expect(republished.body.publishedAt).toBe(firstPublishedAt)

    // Unpublishing clears it.
    const unpublished = await api('PATCH', `/api/contents/${content.id}`, { body: { status: 'IN_REVIEW' } })
    expect(unpublished.body).toMatchObject({ status: 'IN_REVIEW', publishedAt: null })

    // Publishing again records a new date.
    const publishedAgain = await api('PATCH', `/api/contents/${content.id}`, { body: { status: 'PUBLISHED' } })
    expect(new Date(publishedAgain.body.publishedAt).getTime())
      .toBeGreaterThanOrEqual(new Date(firstPublishedAt).getTime())
  })

  it('ignores a client-supplied publishedAt on update', async () => {
    const testClient = await getTestClient()
    const content = await createTestContent(testClient.id)
    const { status, body } = await api('PATCH', `/api/contents/${content.id}`, {
      body: { title: `${TEST_MARKER} Başlık`, publishedAt: '2020-01-01T00:00:00.000Z' },
    })
    expect(status).toBe(200)
    expect(body.publishedAt).toBeNull()
  })

  it('moves a content to another client', async () => {
    const testClient = await getTestClient()
    const otherClient = await getOtherClient()
    const content = await createTestContent(testClient.id)
    const { status, body } = await api('PATCH', `/api/contents/${content.id}`, { body: { clientId: otherClient.id } })

    expect(status).toBe(200)
    expect(body.client).toEqual({ id: otherClient.id, name: otherClient.name })
  })

  it('clears the body when an empty string is sent', async () => {
    const testClient = await getTestClient()
    const content = await createTestContent(testClient.id, { body: 'Silinecek metin' })
    const { body } = await api('PATCH', `/api/contents/${content.id}`, { body: { body: '' } })
    expect(body.body).toBeNull()
  })

  it('rejects an empty update with 422', async () => {
    const testClient = await getTestClient()
    const content = await createTestContent(testClient.id)
    const { status, body } = await api('PATCH', `/api/contents/${content.id}`, { body: {} })
    expect(status).toBe(422)
    expect(body.data.fieldErrors).toEqual({ _form: 'Güncellenecek en az bir alan gönderiniz.' })
  })

  it('rejects invalid fields and unknown clients with 422', async () => {
    const testClient = await getTestClient()
    const content = await createTestContent(testClient.id)

    const invalid = await api('PATCH', `/api/contents/${content.id}`, { body: { status: 'DONE' } })
    expect(invalid.status).toBe(422)
    expect(invalid.body.data.fieldErrors.status).toBe('Geçerli bir içerik durumu seçiniz.')

    const unknownClient = await api('PATCH', `/api/contents/${content.id}`, { body: { clientId: 'cl_does_not_exist' } })
    expect(unknownClient.status).toBe(422)
    expect(unknownClient.body.data.fieldErrors).toEqual({ clientId: 'Seçilen müşteri bulunamadı.' })

    // Nothing was changed by the rejected requests.
    const { body } = await api('GET', `/api/contents/${content.id}`)
    expect(body).toMatchObject({ status: 'DRAFT', clientId: testClient.id })
  })

  it('returns 404 / 400 for unknown or malformed content ids', async () => {
    const missing = await api('PATCH', '/api/contents/ct_does_not_exist', { body: { title: 'Geçerli başlık' } })
    expect(missing.status).toBe(404)
    expect(missing.body.message).toBe('İçerik bulunamadı.')

    const malformed = await api('PATCH', '/api/contents/bad$id', { body: { title: 'Geçerli başlık' } })
    expect(malformed.status).toBe(400)
  })
})
