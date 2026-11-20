import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '~': rootDir,
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        // Builds the app and calls the real HTTP API against the local
        // Docker database. Requires `npm run db:up`.
        extends: true,
        test: {
          name: 'api',
          environment: 'node',
          include: ['tests/api/**/*.test.ts'],
          setupFiles: ['tests/api/setup-env.ts'],
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 300_000,
        },
      },
    ],
  },
})
