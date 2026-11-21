import { defineConfig } from '@playwright/test'

/**
 * Browser tests (mobile layout checks). They only open pages and dialogs and
 * never save anything, so the demo data stays unchanged.
 *
 * Runs against the dev server (started automatically, or an already running
 * one on :3000), which needs the local database: `npm run db:up`.
 * Uses the installed Google Chrome, so no browser download is needed.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    channel: 'chrome',
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  },
  projects: [
    { name: '375px', use: { viewport: { width: 375, height: 812 } } },
    { name: '393px', use: { viewport: { width: 393, height: 852 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true, timeout: 180_000 },
})
