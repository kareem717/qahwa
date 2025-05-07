import { Hono } from 'hono'
import type { Ai } from '@cloudflare/workers-types'
import { getDb } from '@/db'
import { notes } from '@/db/schema'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

type Bindings = {
  AI: Ai
  DATABASE_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const res = await db.select().from(notes)
  return c.json(res)
})

app.post(
  '/note',
  zValidator(
    'json',
    z.object({
      content: z.object({
        me: z.string(),
        them: z.string(),
      }).array(),
      title: z.string(),
    })
  ),
  async (c) => {
    const reqBody = c.req.valid('json')

    const db = getDb(c.env.DATABASE_URL)

    const res = await db.insert(notes).values(reqBody).returning()

    return c.json({ res })
  })

export default app