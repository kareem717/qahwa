import { Hono } from 'hono'
import { getDb } from '@note/db'
import { notes } from '@note/db/schema'
import { env } from 'cloudflare:workers'
import { cors } from 'hono/cors'
import { authHandler } from './handlers/auth-handler'

export type Bindings = {
  DATABASE_URL: string
  GOOGLE_API_KEY: string
  BEARER_TOKEN: string
  ENV: "development" | "production"
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  LANDING_URL: string
  ELECTRON_URL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()
  .use(
    "*",
    cors({
      origin: [env.LANDING_URL, env.ELECTRON_URL, `${env.DESKTOP_APP_PROTOCOL}://`],
      // allowHeaders: ["x-api-key"],
      credentials: true,
    })
  ).get('/', async (c) => {
    const db = getDb(env.DATABASE_URL!)
    const res = await db.select().from(notes)
    return c.json(res)
  }).route('/auth', authHandler())

export default app