import { Hono } from 'hono'
import { withAuth, getAuth } from '../lib/middleware/with-auth';
import { HTTPException } from 'hono/http-exception';
import { env } from 'cloudflare:workers';
import { zValidator } from '@hono/zod-validator';
import { getDb } from '@note/db';
import { notes } from '@note/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { InsertNoteSchema } from '@note/db/validation';
import { z } from 'zod';
import { generateNotes } from '../lib/ai/notes';
import { AssemblyAI } from 'assemblyai';

export const noteHandler = () => new Hono()
  .use("*", withAuth())
  .get(
    "/transcribe",
    async (c) => {
      const { session } = getAuth(c)

      if (!session) {
        throw new HTTPException(401, {
          message: "Unauthorized",
        })
      }

      const assembly = new AssemblyAI({
        apiKey: env.ASSEMBLYAI_API_KEY,
      })

      const tempToken = await assembly.realtime.createTemporaryToken({
        expires_in: 60 // in seconds
      });

      return c.json({
        token: tempToken,
      })
    }
  )
  .get(
    "/",
    async (c) => {
      const { session, user } = getAuth(c)

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
      id: z.coerce.number()
    })),
    async (c) => {
      const { session, user } = getAuth(c)

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
      id: z.coerce.number()
    })),
    async (c) => {
      const { session, user } = getAuth(c)

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

      console.log("deleted note", note)

      return c.body(null, 204)
    }
  )
  .patch(
    "/:id",
    zValidator("param", z.object({
      id: z.coerce.number()
    })),
    zValidator("json",
      //TODO: no type inference
      InsertNoteSchema.pick({
        title: true,
        transcript: true,
        userNotes: true,
      }).partial()),
    async (c) => {
      const { session, user } = getAuth(c)

      if (!session || !user) {
        throw new HTTPException(401, {
          message: "Unauthorized",
        })
      }

      const {
        id: userId
      } = user

      const { id } = c.req.valid("param")

      const {
        title,
        transcript,
        userNotes,
      } = c.req.valid("json")

      const db = getDb(env.DATABASE_URL)

      // let note: Note
      // if (noteId) { // Update
      console.log("updating note", id)
      const [note] = await db.update(notes).set({
        title: title ?? undefined,
        transcript: transcript ?? undefined,
        userNotes: userNotes ?? undefined,
      }).where(
        and(
          eq(notes.id, id),
          eq(notes.userId, Number(userId))
        )
      ).returning()
      // } else { // Insert
      //   console.log("inserting note", noteId)
      //   let insertableTitle = title
      //   if (!insertableTitle) {
      //     // generate with AI
      //     insertableTitle = "G"
      //   }

      //   [note] = await db.insert(notes).values({
      //     userId: Number(userId),
      //     title: insertableTitle,
      //     userNotes,
      //   }).returning()
      // }

      return c.json({
        note,
      })
    }
  )
  .put(
    "/:id/generate",
    zValidator("param", z.object({
      id: z.coerce.number(),
    })),
    async (c) => {
      const { user } = getAuth(c)

      if (!user) {
        throw new HTTPException(401, {
          message: "Unauthorized",
        })
      }

      const { id } = c.req.valid("param")

      const db = getDb(env.DATABASE_URL)

      const [note] = await db.select().from(notes).where(eq(notes.id, id))

      if (!note) {
        throw new HTTPException(404, {
          message: "Note not found",
        })
      }

      if (!note.transcript) {
        throw new HTTPException(400, {
          message: "Note has no transcript",
        })
      }


      if (note.userId !== Number(user.id)) {
        throw new HTTPException(403, {
          message: "You are not allowed to generate notes for this note",
        })
      }

      let generatedNotes: string
      try {
        // send stream to client
        const result = generateNotes(note.transcript)
        // Mark the response as a v1 data stream:
        c.header('X-Vercel-AI-Data-Stream', 'v1');
        c.header('Content-Type', 'text/plain; charset=utf-8');

        return result.toDataStreamResponse();

        //wait for stream to finish and use to save in db
        // generatedNotes = await text
      } catch (error) {
        throw new HTTPException(500, {
          message: "Failed to generate notes",
        })
      }


      // try {
      //   await db.update(notes).set({
      //     generatedNotes: generatedNotes,
      //   }).where(eq(notes.id, id))

      //   return c.status(200)
      // } catch (error) {
      //   throw new HTTPException(500, {
      //     message: "Failed to update note",
      //   })
      // }

    }
  )
