import { Hono } from 'hono'
import { withAuth } from '../lib/middleware/with-auth';
import { HTTPException } from 'hono/http-exception';
import { env } from 'cloudflare:workers';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb } from '@note/db';
import { notes } from '@note/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Note } from '@note/db/types';

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
        .select({
          id: notes.id,
          title: notes.title,
          updatedAt: notes.updatedAt,
        })
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
        )

      return c.json({
        note: note ?? null,
      })
    }
  )
  .delete(
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
            eq(notes.id, Number(id))
          )
        )

      if (!note) {
        throw new HTTPException(404, {
          message: "Note not found",
        })
      } else if (note.userId !== Number(userId)) {
        throw new HTTPException(403, {
          message: "You are not allowed to delete this note",
        })
      }

      await db.delete(notes).where(eq(notes.id, Number(id)))

      return c.status(200)
    }
  )
  .put(
    "/",
    zValidator("json", z.object({
      id: z.coerce.number(),
      title: z.string().min(1),
      transcript: z.array(z.object({
        me: z.string().min(1),
        them: z.string().min(1),
      })),
      userNotes: z.any(),
    }).partial()),
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

      const {
        id: noteId,
        title,
        transcript,
        userNotes,
      } = c.req.valid("json")

      const db = getDb(env.DATABASE_URL)

      let note: Note
      if (noteId) {
        [note] = await db.update(notes).set({
          title: title ?? undefined,
          transcript: transcript ?? undefined,
          userNotes: userNotes ?? undefined,
        }).where(
          and(
            eq(notes.id, Number(noteId)),
            eq(notes.userId, Number(userId))
          )
        ).returning()
      } else {
        let insertableTitle = title
        if (!insertableTitle) {
          // generate with AI
          insertableTitle = "GENERATED TITLE"
        }

        [note] = await db.insert(notes).values({
          userId: Number(userId),
          title: insertableTitle,
          userNotes,
        }).returning()
      }

      return c.json({
        note,
      })
    }
  )
