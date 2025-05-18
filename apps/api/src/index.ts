import { Hono } from 'hono'
import { env } from 'cloudflare:workers'
import { cors } from 'hono/cors'
import { authHandler } from './handlers/auth-handler'
import { noteHandler } from './handlers/note-handler'
import { waitlistEmail } from '@note/db/schema'
import { zValidator } from '@hono/zod-validator';
import { InsertWaitlistEmailSchema } from '@note/db/validation'
import { getDb } from '@note/db'

const app = new Hono()
  .use(
    "*",
    cors({
      origin: [env.LANDING_URL, env.ELECTRON_URL, `${env.DESKTOP_APP_PROTOCOL}://`],
      // credentials: true,
    })
  )
  .route('/auth', authHandler())
  .route('/note', noteHandler())
  .post(
    '/waitlist',
    zValidator('json', InsertWaitlistEmailSchema),
    async (c) => {
      const { email } = c.req.valid('json')
      const db = getDb(env.DATABASE_URL)
      await db.insert(waitlistEmail).values({ email })
      return c.json({ success: true })
    }
  )

export default app