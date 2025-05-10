import { createServerFn } from '@tanstack/react-start'
import { InsertWaitlistEmailSchema } from '@note/db/validation'
import { getDb } from '@note/db'
import { waitlistEmail } from '@note/db/schema'
import { InsertWaitlistEmail } from '@note/db/types'

export const addWaitlistEmail = createServerFn({
  method: 'POST',
})
  .validator((req: InsertWaitlistEmail) => {
    return InsertWaitlistEmailSchema.parse(req)
  })
  .handler(async (ctx) => {
    const db = getDb(import.meta.env.DATABASE_URL)
    await db.insert(waitlistEmail).values({ email: ctx.data.email })
  })