import { expect, test, type Page } from '@playwright/test'

/**
 * On phones nothing may make the page wider than the screen: every page and every
 * dialog must keep document.documentElement.scrollWidth === clientWidth.
 * Screenshots of each state are written to test-results/ for a visual check.
 */

const CLIENT = '/musteriler/seed_client_lina_kozmetik'
const CONTENT = '/icerikler/seed_content_12'

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(scrollWidth, `${label}: page is ${scrollWidth - clientWidth}px wider than the screen`).toBe(clientWidth)
}

async function snapshot(page: Page, name: string) {
  await page.screenshot({ path: test.info().outputPath(`${name}.png`) })
}

async function open(page: Page, path: string) {
  await page.goto(path)
  // Hydrated: Vue has mounted, so buttons react to taps.
  await page.waitForFunction(() => Boolean((document.querySelector('#__nuxt') as { __vue_app__?: unknown } | null)?.__vue_app__))
  await page.waitForLoadState('networkidle')
  // The dev server's floating devtools button covers bottom sheets; it never ships to production.
  await page.addStyleTag({ content: '#nuxt-devtools-container { display: none !important }' })
}

const dialog = (page: Page) => page.locator('[role="dialog"][aria-modal="true"]').last()

test.describe('no horizontal overflow on phones', () => {
  for (const [name, path] of [
    ['genel-bakis', '/'],
    ['musteriler', '/musteriler'],
    ['icerikler', '/icerikler'],
    ['musteri-detay', CLIENT],
    ['icerik-detay', CONTENT],
  ] as const) {
    test(`page: ${name}`, async ({ page }) => {
      await open(page, path)
      await expectNoHorizontalOverflow(page, name)
      await snapshot(page, name)
    })
  }

  test('dialog: new client', async ({ page }) => {
    await open(page, '/musteriler')
    await page.getByRole('button', { name: 'Yeni müşteri' }).click()
    await expect(dialog(page)).toBeVisible()
    await expectNoHorizontalOverflow(page, 'new client')
    await snapshot(page, 'modal-yeni-musteri')
  })

  test('dialog: edit client', async ({ page }) => {
    await open(page, CLIENT)
    await page.getByRole('button', { name: 'Diğer işlemler' }).click()
    await page.getByRole('menuitem', { name: 'Düzenle' }).click()
    await expect(dialog(page)).toBeVisible()
    await expectNoHorizontalOverflow(page, 'edit client')
    await snapshot(page, 'modal-musteri-duzenle')
  })

  test('dialog: new content and date picker', async ({ page }) => {
    await open(page, '/icerikler')
    await page.getByRole('button', { name: 'Yeni içerik' }).click()
    await expect(dialog(page)).toBeVisible()
    await expectNoHorizontalOverflow(page, 'new content')
    await snapshot(page, 'modal-yeni-icerik')

    await page.getByRole('button', { name: 'Takvimden tarih seç' }).click()
    await expect(page.getByRole('dialog', { name: 'Tarih seç' })).toBeVisible()
    await expectNoHorizontalOverflow(page, 'date picker')
    await snapshot(page, 'tarih-secici')
  })

  test('dialog: edit content', async ({ page }) => {
    await open(page, CONTENT)
    await page.getByRole('button', { name: 'Diğer işlemler' }).click()
    await page.getByRole('menuitem', { name: 'Düzenle' }).click()
    await expect(dialog(page)).toBeVisible()
    await expectNoHorizontalOverflow(page, 'edit content')
    await snapshot(page, 'modal-icerik-duzenle')
  })

  test('actions sheet and delete confirmation', async ({ page }) => {
    await open(page, CONTENT)
    await page.getByRole('button', { name: 'Diğer işlemler' }).click()
    await expect(page.getByRole('menuitem', { name: 'Sil' })).toBeVisible()
    await expectNoHorizontalOverflow(page, 'actions sheet')
    await snapshot(page, 'islem-paneli')

    await page.getByRole('menuitem', { name: 'Sil' }).click()
    await expect(dialog(page)).toBeVisible()
    await expectNoHorizontalOverflow(page, 'delete confirmation')
    await snapshot(page, 'silme-onayi')
  })

  test('filter sheet', async ({ page }) => {
    await open(page, '/icerikler')
    await page.getByRole('button', { name: /^Filtreler/ }).click()
    await expect(dialog(page)).toBeVisible()
    await expectNoHorizontalOverflow(page, 'filter sheet')
    await snapshot(page, 'filtre-paneli')
  })

  test('status bar tooltip stays on screen and closes on touch elsewhere', async ({ page }) => {
    await open(page, '/musteriler')
    // Hover the last visible bar (closest to the right edge) with a mouse-like pointer.
    const bar = page.locator('ul li .relative.flex.items-center').filter({ visible: true }).first()
    await bar.dispatchEvent('pointerenter', { pointerType: 'mouse' })
    const tooltip = page.locator('body > span.fixed.pointer-events-none')
    await expect(tooltip).toBeVisible()
    const box = (await tooltip.boundingBox())!
    const width = await page.evaluate(() => document.documentElement.clientWidth)
    expect(box.x).toBeGreaterThanOrEqual(8)
    expect(box.x + box.width).toBeLessThanOrEqual(width - 8)
    await expectNoHorizontalOverflow(page, 'status bar tooltip')
    await snapshot(page, 'dagilim-tooltip')

    await page.locator('h1').dispatchEvent('pointerdown')
    await expect(tooltip).toHaveCount(0)
  })
})
