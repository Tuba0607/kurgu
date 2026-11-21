import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
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

// The test server inherits these: the cron endpoint is configured, but demo resets
// stay disabled (no ALLOW_DEMO_SEED), so the tests can never wipe the database.
const CRON_TEST_SECRET = 'test-cron-secret-0123456789'
process.env.CRON_SECRET = CRON_TEST_SECRET
delete process.env.ALLOW_DEMO_SEED

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
      email: 'E-posta adresini ornek@firma.com biçiminde girin.',
    })
  })

  it('rejects an invalid phone number with 422 and does not create the client', async () => {
    const name = `${TEST_MARKER} Invalid Phone`
    const { status, body } = await api('POST', '/api/clients', { body: { name, phone: '05454454545454959454' } })

    expect(status).toBe(422)
    expect(body.data.fieldErrors).toEqual({ phone: 'Telefon numarasını 05XX XXX XX XX biçiminde, 10 haneli cep numarası olarak girin.' })
    expect(await testPrisma.client.count({ where: { name } })).toBe(0)
  })

  it('stores a valid phone number in the canonical format', async () => {
    const { status, body } = await api('POST', '/api/clients', {
      body: { name: `${TEST_MARKER} Valid Phone`, phone: '+90 532 123 45 67' },
    })

    expect(status).toBe(201)
    expect(body.phone).toBe('+90 532 123 45 67')
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

  it('returns a client with per-status content counts (contents are paginated separately)', async () => {
    const { status, body } = await api('GET', `/api/clients/${LINA}`)

    expect(status).toBe(200)
    expect(body).toMatchObject({ id: LINA, name: 'Lina Kozmetik', contentCount: 3 })
    expect(body).not.toHaveProperty('contents')
    expect(Object.keys(body.statusCounts).sort()).toEqual(['DRAFT', 'IN_REVIEW', 'PUBLISHED'])
    const sum = Object.values(body.statusCounts as Record<string, number>).reduce((a, b) => a + b, 0)
    expect(sum).toBe(3)
    expect(body.statusCounts).toEqual({
      DRAFT: await testPrisma.content.count({ where: { clientId: LINA, status: 'DRAFT' } }),
      IN_REVIEW: await testPrisma.content.count({ where: { clientId: LINA, status: 'IN_REVIEW' } }),
      PUBLISHED: await testPrisma.content.count({ where: { clientId: LINA, status: 'PUBLISHED' } }),
    })
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
  it('returns the first page of 10 by default, newest first, without the body field', async () => {
    const { status, body } = await api('GET', '/api/contents')

    expect(status).toBe(200)
    expect(body).toMatchObject({
      page: 1,
      pageSize: 10,
      total: countsBefore.contents,
      totalPages: Math.ceil(countsBefore.contents / 10),
    })
    expect(body.items).toHaveLength(Math.min(10, countsBefore.contents))
    expect(body.items[0]).not.toHaveProperty('body')
    expect(body.items[0].client).toEqual({ id: expect.any(String), name: expect.any(String) })
    expectSortedNewestFirst(body.items)
  })

  it('pages through all contents without gaps or duplicates', async () => {
    const all = await api('GET', '/api/contents?pageSize=50')
    const pageSize = 4
    const totalPages = Math.ceil(countsBefore.contents / pageSize)
    const seen: string[] = []
    for (let page = 1; page <= totalPages; page++) {
      const { body } = await api('GET', `/api/contents?page=${page}&pageSize=${pageSize}`)
      expect(body).toMatchObject({ page, pageSize, total: countsBefore.contents, totalPages })
      expect(body.items.length).toBe(page < totalPages ? pageSize : countsBefore.contents - pageSize * (totalPages - 1))
      seen.push(...body.items.map((content: Json) => content.id))
    }
    expect(seen).toEqual(all.body.items.map((content: Json) => content.id))
  })

  it('returns an empty page (with the real totals) beyond the last page', async () => {
    const { status, body } = await api('GET', '/api/contents?page=999')
    expect(status).toBe(200)
    expect(body.items).toEqual([])
    expect(body).toMatchObject({ page: 999, total: countsBefore.contents, totalPages: Math.ceil(countsBefore.contents / 10) })
  })

  it('paginates filtered results with filter-specific totals', async () => {
    const { body } = await api('GET', `/api/contents?clientId=${LINA}&pageSize=2&page=2`)
    expect(body).toMatchObject({ page: 2, pageSize: 2, total: 3, totalPages: 2 })
    expect(body.items).toHaveLength(1)
    expect(body.items[0].client.id).toBe(LINA)
  })

  it('reports zero pages for an empty result', async () => {
    const { body } = await api('GET', `/api/contents?clientId=${MAVI_ROTA}&search=eşleşmeyen-başlık`)
    expect(body).toMatchObject({ items: [], total: 0, totalPages: 0, page: 1 })
  })

  it('rejects invalid page and pageSize values with 400', async () => {
    for (const query of ['page=0', 'page=-1', 'page=abc', 'page=1.5', 'pageSize=0', 'pageSize=51']) {
      const { status, body } = await api('GET', `/api/contents?${query}`)
      expect(status, query).toBe(400)
      const field = query.split('=')[0]!
      expect(body.data.fieldErrors[field], query).toBe(field === 'page' ? 'Geçersiz sayfa numarası.' : 'Geçersiz sayfa boyutu.')
    }
  })

  it('filters by status', async () => {
    const { body } = await api('GET', '/api/contents?status=PUBLISHED&pageSize=50')
    expect(body.items.length).toBeGreaterThan(0)
    expect(body.items.every((content: Json) => content.status === 'PUBLISHED')).toBe(true)
  })

  it('filters by client', async () => {
    const { body } = await api('GET', `/api/contents?clientId=${LINA}`)
    expect(body.items).toHaveLength(3)
    expect(body.total).toBe(3)
    expect(body.items.every((content: Json) => content.client.id === LINA)).toBe(true)
  })

  it('searches by title, case-insensitively', async () => {
    const { body } = await api('GET', '/api/contents?search=REHBER')
    expect(body.items.map((content: Json) => content.title)).toEqual(['Cilt tipine göre bakım rehberi'])
  })

  it('combines search, status and client filters', async () => {
    const byClientAndStatus = await api('GET', `/api/contents?clientId=${MAVI_ROTA}&status=PUBLISHED`)
    expect(byClientAndStatus.body.items).toHaveLength(1)

    const allThree = await api('GET', `/api/contents?clientId=${MAVI_ROTA}&status=PUBLISHED&search=koy`)
    expect(allThree.body.items.map((content: Json) => content.title)).toEqual(['Ege’de keşfedilmemiş 7 koy'])

    const noMatch = await api('GET', `/api/contents?clientId=${MAVI_ROTA}&status=PUBLISHED&search=balon`)
    expect(noMatch.body.items).toEqual([])
  })

  it('treats empty filter values as no filter', async () => {
    const { status, body } = await api('GET', '/api/contents?status=&clientId=&search=&page=')
    expect(status).toBe(200)
    expect(body.total).toBe(countsBefore.contents)
    expect(body.page).toBe(1)
  })

  it('returns an empty list for a well-formed but unknown client id', async () => {
    const { status, body } = await api('GET', '/api/contents?clientId=cl_does_not_exist')
    expect(status).toBe(200)
    expect(body.items).toEqual([])
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
      body: { title: 'a', type: 'VIDEO', status: 'DONE', clientId: testClient.id },
    })
    expect(status).toBe(422)
    expect(body.data.fieldErrors).toEqual({
      title: 'Başlık en az 2 karakter olmalıdır.',
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

describe('Clients API: update (PATCH)', () => {
  it('updates the client fields and keeps its contents', async () => {
    const client = await createTestClient({ contactName: 'Eski Yetkili', phone: '05321234567' })
    const content = await createTestContent(client.id, { status: 'PUBLISHED' })

    const { status, body } = await api('PATCH', `/api/clients/${client.id}`, {
      body: {
        name: `${TEST_MARKER} Güncel Firma`,
        contactName: 'Yeni Yetkili',
        email: 'yeni@firma.example',
        phone: '+90 533 765 43 21',
        industry: '',
      },
    })

    expect(status).toBe(200)
    expect(body).toMatchObject({
      id: client.id,
      name: `${TEST_MARKER} Güncel Firma`,
      contactName: 'Yeni Yetkili',
      email: 'yeni@firma.example',
      phone: '+90 533 765 43 21',
      industry: null,
      contentCount: 1,
    })

    // Related content is untouched
    const detail = await api('GET', `/api/clients/${client.id}`)
    const related = await api('GET', `/api/contents?clientId=${client.id}`)
    expect(related.body.items.map((item: Json) => item.id)).toEqual([content.id])
    expect(detail.body.contentCount).toBe(1)
    const stored = await testPrisma.content.findUniqueOrThrow({ where: { id: content.id } })
    expect(stored).toMatchObject({ clientId: client.id, status: 'PUBLISHED', title: content.title })
    expect(stored.publishedAt?.toISOString()).toBe(content.publishedAt)
  })

  it('applies a partial update without touching other fields', async () => {
    const client = await createTestClient({ email: 'kalsin@firma.example', industry: 'Medya' })
    const { status, body } = await api('PATCH', `/api/clients/${client.id}`, { body: { contactName: 'Sadece Yetkili' } })

    expect(status).toBe(200)
    expect(body).toMatchObject({ contactName: 'Sadece Yetkili', email: 'kalsin@firma.example', industry: 'Medya', name: client.name })
  })

  it('rejects invalid data with 422 and leaves the client unchanged', async () => {
    const client = await createTestClient({ phone: '05321234567' })
    const { status, body } = await api('PATCH', `/api/clients/${client.id}`, {
      body: { name: ' ', email: 'yanlis', phone: '0532' },
    })

    expect(status).toBe(422)
    expect(body.data.fieldErrors).toEqual({
      name: 'Firma adı zorunludur.',
      email: 'E-posta adresini ornek@firma.com biçiminde girin.',
      phone: 'Telefon numarasını 05XX XXX XX XX biçiminde, 10 haneli cep numarası olarak girin.',
    })
    const stored = await testPrisma.client.findUniqueOrThrow({ where: { id: client.id } })
    expect(stored).toMatchObject({ name: client.name, phone: '+90 532 123 45 67' })
  })

  it('rejects an empty update with 422', async () => {
    const client = await createTestClient()
    const { status, body } = await api('PATCH', `/api/clients/${client.id}`, { body: {} })
    expect(status).toBe(422)
    expect(body.data.fieldErrors).toEqual({ _form: 'Güncellenecek en az bir alan gönderiniz.' })
  })

  it('returns 404 for an unknown client and 400 for a malformed id', async () => {
    const missing = await api('PATCH', '/api/clients/cl_does_not_exist', { body: { name: 'Geçerli Ad' } })
    expect(missing.status).toBe(404)
    expect(missing.body.message).toBe('Müşteri bulunamadı.')

    const malformed = await api('PATCH', '/api/clients/bad$id', { body: { name: 'Geçerli Ad' } })
    expect(malformed.status).toBe(400)
  })
})

describe('P1: status history, filters, metrics and deletion', () => {
  it('records the initial status and every status change', async () => {
    const client = await createTestClient()
    const content = await createTestContent(client.id, { status: 'DRAFT' })
    await api('PATCH', `/api/contents/${content.id}`, { body: { status: 'IN_REVIEW' } })
    await api('PATCH', `/api/contents/${content.id}`, { body: { title: `${TEST_MARKER} Yalnızca başlık` } })
    const { body } = await api('PATCH', `/api/contents/${content.id}`, { body: { status: 'PUBLISHED' } })

    expect(body.statusChanges.map((change: Json) => [change.fromStatus, change.toStatus])).toEqual([
      [null, 'DRAFT'],
      ['DRAFT', 'IN_REVIEW'],
      ['IN_REVIEW', 'PUBLISHED'],
    ])
    expect(new Date(body.statusChangedAt).getTime()).toBeGreaterThan(Date.now() - 60_000)
  })

  it('stores platform only for social posts and accepts a planned date', async () => {
    const client = await createTestClient()
    const social = await createTestContent(client.id, { type: 'SOCIAL_POST', platform: 'X', scheduledAt: '2030-01-15' })
    expect(social).toMatchObject({ platform: 'X' })
    expect(social.scheduledAt.slice(0, 10)).toBe('2030-01-15')

    const blog = await createTestContent(client.id, { type: 'BLOG_POST', platform: 'X' })
    expect(blog.platform).toBeNull()

    const invalid = await api('POST', '/api/contents', { body: { title: `${TEST_MARKER} x`, type: 'SOCIAL_POST', clientId: client.id, platform: 'TIKTOK', scheduledAt: '15.01.2030' } })
    expect(invalid.status).toBe(422)
    expect(Object.keys(invalid.body.data.fieldErrors).sort()).toEqual(['platform', 'scheduledAt'])
  })

  it('filters by type, sorts and returns per-status tab counts', async () => {
    const { body } = await api('GET', '/api/contents?type=WEB_PAGE&pageSize=50')
    expect(body.items.length).toBeGreaterThan(0)
    expect(body.items.every((content: Json) => content.type === 'WEB_PAGE')).toBe(true)
    const tabTotal = Object.values(body.statusCounts as Record<string, number>).reduce((a, b) => a + b, 0)
    expect(tabTotal).toBe(body.total)

    const waiting = await api('GET', '/api/contents?status=IN_REVIEW&sort=waiting&pageSize=50')
    const times = waiting.body.items.map((content: Json) => new Date(content.statusChangedAt).getTime())
    expect(times).toEqual([...times].sort((a, b) => a - b))

    const invalid = await api('GET', '/api/contents?type=VIDEO&sort=random')
    expect(invalid.status).toBe(400)
  })

  it('returns the dashboard action metrics', async () => {
    const { body } = await api('GET', '/api/dashboard')
    expect(body.review.total).toBe(body.statusCounts.IN_REVIEW)
    expect(body.review.longWaiting).toBeLessThanOrEqual(body.review.total)
    expect(body.schedule).toEqual({ dueThisWeek: expect.any(Number), overdue: expect.any(Number) })
    expect(body.addedLastWeek).toEqual(expect.any(Number))
  })

  it('counts only unpublished contents as overdue', async () => {
    const before = (await api('GET', '/api/dashboard')).body.schedule.overdue
    const client = await createTestClient()
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    // Already published with a past planned date: not overdue.
    await createTestContent(client.id, { status: 'PUBLISHED', scheduledAt: lastWeek })
    expect((await api('GET', '/api/dashboard')).body.schedule.overdue).toBe(before)
    // Still a draft / waiting for approval with a past planned date: overdue.
    await createTestContent(client.id, { status: 'DRAFT', scheduledAt: lastWeek })
    await createTestContent(client.id, { status: 'IN_REVIEW', scheduledAt: lastWeek })
    expect((await api('GET', '/api/dashboard')).body.schedule.overdue).toBe(before + 2)
  })

  it('lists industries and client status counts', async () => {
    const industries = await api('GET', '/api/industries')
    expect(industries.body).toEqual([...industries.body].sort((a: string, b: string) => a.localeCompare(b, 'tr-TR')))
    const clients = await api('GET', '/api/clients?sort=name')
    const names = clients.body.map((client: Json) => client.name)
    expect(names).toEqual([...names].sort((a: string, b: string) => a.localeCompare(b, 'tr-TR')))
    expect(clients.body[0].statusCounts).toEqual({ DRAFT: expect.any(Number), IN_REVIEW: expect.any(Number), PUBLISHED: expect.any(Number) })
  })

  it('deletes a content and returns 404 afterwards', async () => {
    const client = await createTestClient()
    const content = await createTestContent(client.id)
    expect((await api('DELETE', `/api/contents/${content.id}`)).status).toBe(204)
    expect((await api('GET', `/api/contents/${content.id}`)).status).toBe(404)
    expect((await api('DELETE', `/api/contents/${content.id}`)).status).toBe(404)
  })

  it('deletes a client together with its contents and reports how many', async () => {
    const client = await createTestClient()
    await createTestContent(client.id)
    await createTestContent(client.id)
    const { status, body } = await api('DELETE', `/api/clients/${client.id}`)
    expect(status).toBe(200)
    expect(body).toEqual({ deletedContents: 2 })
    expect(await testPrisma.content.count({ where: { clientId: client.id } })).toBe(0)
  })
})

describe('Longest waiting sort', () => {
  it('lists only contents waiting for approval, longest waiting first, even without a status filter', async () => {
    const all = await api('GET', '/api/contents?sort=waiting&pageSize=50')
    const reviewCount = await testPrisma.content.count({ where: { status: 'IN_REVIEW' } })
    expect(all.body.total).toBe(reviewCount)
    expect(all.body.items.every((content: Json) => content.status === 'IN_REVIEW')).toBe(true)
    const times = all.body.items.map((content: Json) => new Date(content.statusChangedAt).getTime())
    expect(times).toEqual([...times].sort((a, b) => a - b))

    // A conflicting status filter does not bring published contents back.
    const published = await api('GET', '/api/contents?sort=waiting&status=PUBLISHED&pageSize=50')
    expect(published.body.items.every((content: Json) => content.status === 'IN_REVIEW')).toBe(true)
  })

  it('puts a content that just went to review at the end', async () => {
    const client = await createTestClient()
    const content = await createTestContent(client.id, { status: 'IN_REVIEW' })
    const { body } = await api('GET', '/api/contents?sort=waiting&pageSize=50')
    expect(body.items.at(-1).id).toBe(content.id)
  })
})

describe('Turkish routes', () => {
  it.each([
    ['/contents?status=IN_REVIEW&sort=waiting', '/icerikler?durum=onay&sirala=bekleyen'],
    ['/clients/seed_client_lina_kozmetik', '/musteriler/seed_client_lina_kozmetik'],
  ])('redirects %s permanently to %s', async (from, to) => {
    const response = await fetch(from, { redirect: 'manual' })
    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe(to)
  })

  it('serves the Turkish pages and keeps the API untouched', async () => {
    expect((await fetch('/icerikler?durum=onay')).status).toBe(200)
    expect((await fetch('/musteriler')).status).toBe(200)
    expect((await api('GET', '/api/contents?status=IN_REVIEW')).status).toBe(200)
  })
})

describe('Nightly demo reset (cron)', () => {
  it('rejects requests without the cron secret', async () => {
    expect((await fetch('/api/cron/reset-demo')).status).toBe(401)
    expect((await fetch('/api/cron/reset-demo', { headers: { authorization: 'Bearer wrong' } })).status).toBe(401)
  })

  it('refuses to reset when the deployment does not allow demo data', async () => {
    const response = await fetch('/api/cron/reset-demo', { headers: { authorization: `Bearer ${CRON_TEST_SECRET}` } })
    expect(response.status).toBe(403)
    // Nothing was deleted
    expect(await testPrisma.client.count()).toBeGreaterThan(0)
  })
})
