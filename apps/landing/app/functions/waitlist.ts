import { createServerFn } from '@tanstack/start'
import { InsertWaitlistEmailSchema } from '@note/db/validation'
import { getDb } from '@note/db'
import { waitlistEmail } from '@note/db/schema'
import { InsertWaitlistEmail } from '@note/db/types'
import { env } from '@note/landing/env'

export const addWaitlistEmail = createServerFn({
  method: 'POST',
})
  .validator((req: InsertWaitlistEmail) => {
    return InsertWaitlistEmailSchema.parse(req)
  })
  .handler(async (ctx) => {
    const db = getDb(env.DATABASE_URL)
    await db.insert(waitlistEmail).values(ctx.data)
  })