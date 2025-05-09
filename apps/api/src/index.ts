import { Hono } from 'hono'
import { getDb } from '@note/db'
import { notes } from '@note/db/schema'
import { auth } from '@note/api/lib/auth'
import { env } from 'cloudflare:workers'

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

app.get('/', async (c) => {
  const db = getDb(env.DATABASE_URL!)
  const res = await db.select().from(notes)
  return c.json(res)
})

export const authHandler = app.on(["POST", "GET"], "/auth/*", (c) => {
  return auth.handler(c.req.raw);
})

export default app