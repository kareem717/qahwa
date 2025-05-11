import { Hono } from 'hono'
import { withAuth } from '../lib/middleware/with-auth';
import { HTTPException } from 'hono/http-exception';
import { env } from 'cloudflare:workers';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb } from '@note/db';
import { notes } from '@note/db/schema';
import { eq, and } from 'drizzle-orm';

export const noteHandler = () => new Hono()
  .use("*", withAuth())
  .get(
    "/",
    async (c) => {
      const session = c.get("session")
      const user = c.get("user")

      if (!session || !user) {
        throw new HTTPException(401, {
          message: "Unauthorized",
        })
      }

      const {
        id // TODO: should be number
      } = user

      const db = getDb(env.DATABASE_URL)

      const userNotes = await db.query.notes.findMany({
        where: eq(notes.userId, Number(id)),
      })

      return c.json({
        notes: userNotes || [],
      })
    }
  )
  .get(
    "/:id",
    zValidator("param", z.object({
      id: z.coerce.number(),
    })),
    async (c) => {
      const session = c.get("session")
      const user = c.get("user")

      if (!session || !user) {
        throw new HTTPException(401, {
          message: "Unauthorized",
        })
      }

      const {
        id: userId
      } = user

      const { id } = c.req.valid("param")

      const db = getDb(env.DATABASE_URL)

      const note = await db.query.notes.findFirst({
        where: and(eq(notes.userId, Number(userId)), eq(notes.id, Number(id))),
      })

      return c.json({
        note: note || null,
      })
    }
  )
