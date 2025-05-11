import { Hono } from 'hono'
import { withAuth } from '../lib/middleware/with-auth';
import { HTTPException } from 'hono/http-exception';
import { env } from 'cloudflare:workers';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb } from '@note/db';
import { notes } from '@note/db/schema';
import { eq, and, desc } from 'drizzle-orm';

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


      const userNotes = await db
        .select()
        .from(notes)
        .where(
          and(
            eq(notes.userId, Number(id))
          )
        ).orderBy(desc(notes.updatedAt)) ?? []

      return c.json({
        notes: userNotes,
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

      const [note] = await db
        .select()
        .from(notes)
        .where(
          and(
            eq(notes.userId, Number(userId)),
            eq(notes.id, Number(id))
          )
        ) ?? null

      return c.json({
        note,
      })
    }
  )
  .post(
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

      const [note] = await db.insert(notes).values({
        userId: Number(id),
      }).returning()


      return c.json({
        note,
      })
    }
  )
