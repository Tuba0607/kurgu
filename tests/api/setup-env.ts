// Loads .env for API integration tests and refuses to run against anything
// other than the local Docker database of this project.
import 'dotenv/config'

const EXPECTED = { hosts: ['localhost', '127.0.0.1'], port: '5435', database: 'kilit_content_panel' }

const rawUrl = process.env.DATABASE_URL
if (!rawUrl) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and start the local database.')
}

const url = new URL(rawUrl)
const database = url.pathname.replace(/^\//, '')

if (!EXPECTED.hosts.includes(url.hostname) || url.port !== EXPECTED.port || database !== EXPECTED.database) {
  throw new Error(
    `API tests only run against the local database (localhost:${EXPECTED.port}/${EXPECTED.database}). `
    + `Refusing to run against ${url.hostname}:${url.port}/${database}.`,
  )
}
