import { Hono } from "hono";
import { withAuth, getAuth } from "../lib/middleware/with-auth";
import { HTTPException } from "hono/http-exception";
import { env } from "cloudflare:workers";
import { zValidator } from "@hono/zod-validator";
import { getDb } from "@qahwa/db";
import { notes } from "@qahwa/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { InsertNoteSchema } from "@qahwa/db/validation";
import { z } from "zod";
import { generateNotes, generateTitle } from "../lib/ai/notes";
import { AssemblyAI } from "assemblyai";
import type { qahwa } from "@qahwa/db/types";
import { stream } from "hono/streaming";

export const noteHandler = () =>
  new Hono()
    .use("*", withAuth())
    .get("/transcribe", async (c) => {
      const { session } = getAuth(c);

      if (!session) {
        throw new HTTPException(401, {
          message: "Unauthorized",
        });
      }

      const assembly = new AssemblyAI({
        apiKey: env.ASSEMBLYAI_API_KEY,
      });

      const tempToken = await assembly.realtime.createTemporaryToken({
        expires_in: 60, // in seconds
      });

      return c.json({
        token: tempToken,
      });
    })
    .get("/", async (c) => {
      const { session, user } = getAuth(c);

      if (!session || !user) {
        throw new HTTPException(401, {
          message: "Unauthorized",
        });
      }

      const db = getDb(env.DATABASE_URL);

      const userNotes =
        (await db
          .select({
            id: notes.id,
            title: notes.title,
            updatedAt: notes.updatedAt,
          })
          .from(notes)
          .where(and(eq(notes.userId, Number(user.id))))
          .orderBy(desc(notes.updatedAt))) ?? [];

      return c.json({
        notes: userNotes,
      });
    })
    .get(
      "/:id",
      zValidator(
        "param",
        z.object({
          id: z.coerce.number(),
        }),
      ),
      async (c) => {
        const { session, user } = getAuth(c);

        if (!session || !user) {
          throw new HTTPException(401, {
            message: "Unauthorized",
          });
        }

        const { id } = c.req.valid("param");

        const db = getDb(env.DATABASE_URL);

        const [qahwa] = await db
          .select()
          .from(notes)
          .where(and(eq(notes.userId, Number(user.id)), eq(notes.id, id)));

        return c.json({
          qahwa: qahwa ?? null,
        });
      },
    )
    .delete(
      "/:id",
      zValidator(
        "param",
        z.object({
          id: z.coerce.number(),
        }),
      ),
      async (c) => {
        const { session, user } = getAuth(c);

        if (!session || !user) {
          throw new HTTPException(401, {
            message: "Unauthorized",
          });
        }

        const { id } = c.req.valid("param");

        const db = getDb(env.DATABASE_URL);

        const [qahwa] = await db
          .select()
          .from(notes)
          .where(and(eq(notes.id, id)));

        if (!qahwa) {
          throw new HTTPException(404, {
            message: "qahwa not found",
          });
        }

        if (qahwa.userId !== Number(user.id)) {
          throw new HTTPException(403, {
            message: "You are not allowed to delete this qahwa",
          });
        }

        await db.delete(notes).where(eq(notes.id, id));

        console.log("deleted qahwa", qahwa);

        return c.body(null, 204);
      },
    )
    .put(
      "/",
      // zValidator("param", z.object({
      //   id: z.coerce.number()
      // })),
      zValidator(
        "json",
        //TODO: no type inference
        InsertNoteSchema.pick({
          id: true,
          title: true,
          transcript: true,
          userNotes: true,
        }).partial(),
      ),
      async (c) => {
        const { session, user } = getAuth(c);

        if (!session || !user) {
          throw new HTTPException(401, {
            message: "Unauthorized",
          });
        }

        // const { id } = c.req.valid("param")

        const { id, title, transcript, userNotes } = c.req.valid("json");

        const db = getDb(env.DATABASE_URL);

        let qahwa: qahwa;
        if (id) {
          // Update
          // console.log("updating qahwa", id)
          [qahwa] = await db
            .update(notes)
            .set({
              title: title ?? undefined,
              transcript: transcript ?? undefined,
              userNotes: userNotes ?? undefined,
            })
            .where(and(eq(notes.id, id), eq(notes.userId, Number(user.id))))
            .returning();
        } else {
          // Insert
          // console.log("inserting qahwa", noteId)
          let insertableTitle = title;
          if (!insertableTitle) {
            if (transcript || userNotes) {
              // generate with AI
              insertableTitle = await generateTitle(
                transcript ?? [],
                userNotes ?? undefined,
              );
            } else {
              throw new HTTPException(400, {
                message: "qahwa has no title, transcript, or user notes",
              });
            }
          }

          [qahwa] = await db
            .insert(notes)
            .values({
              userId: Number(user.id),
              title: insertableTitle,
              userNotes: userNotes ?? undefined,
              transcript: transcript ?? undefined,
            })
            .returning();
        }

        return c.json({
          qahwa,
        });
      },
    )
    .put(
      "/:id/generate",
      zValidator(
        "param",
        z.object({
          id: z.coerce.number(),
        }),
      ),
      async (c) => {
        const { user } = getAuth(c);

        if (!user) {
          throw new HTTPException(401, {
            message: "Unauthorized",
          });
        }

        const { id } = c.req.valid("param");

        const db = getDb(env.DATABASE_URL);

        const [qahwa] = await db.select().from(notes).where(eq(notes.id, id));

        if (!qahwa) {
          throw new HTTPException(404, {
            message: "qahwa not found",
          });
        }

        if (!qahwa.transcript) {
          throw new HTTPException(400, {
            message: "qahwa has no transcript",
          });
        }

        if (qahwa.userId !== Number(user.id)) {
          throw new HTTPException(403, {
            message: "You are not allowed to generate notes for this qahwa",
          });
        }

        let generatedNotes: string; // This variable seems unused now, can be removed if not needed elsewhere
        try {
          // Get the full result from generateNotes, which includes textStream and the full text promise
          const aiStreamResult = generateNotes(
            qahwa.transcript,
            qahwa.userNotes ?? undefined,
          );

          // For immediate streaming to the client
          const byteStream = aiStreamResult.textStream.pipeThrough(
            new TextEncoderStream(),
          );

          c.header("Content-Type", "text/plain; charset=utf-8");
          c.header("Content-Encoding", "Identity"); // Important for Cloudflare Workers

          // Schedule background task to save to DB after stream completion
          c.executionCtx.waitUntil(
            (async () => {
              try {
                const fullGeneratedText = await aiStreamResult.text; // Wait for the full text
                if (fullGeneratedText) {
                  const db = getDb(env.DATABASE_URL);
                  await db
                    .update(notes)
                    .set({
                      generatedNotes: fullGeneratedText, // Save the full text
                    })
                    .where(eq(notes.id, id));
                  console.log(
                    `Generated notes saved to DB for qahwa ID: ${id}`,
                  );
                } else {
                  console.log(`No text generated to save for qahwa ID: ${id}`);
                }
              } catch (dbError) {
                console.error(
                  `Failed to save generated notes to DB for qahwa ID: ${id}`,
                  dbError,
                );
              }
            })(),
          ); // IIFE to immediately invoke and pass the promise

          // Pipe the byteStream into Hono's stream helper for client response
          return stream(c, async (honoStream) => {
            await honoStream.pipe(byteStream);
          });
        } catch (error) {
          console.error(
            "Error in /:id/generate stream handling or DB save scheduling:",
            error,
          );
          throw new HTTPException(500, {
            message: "Failed to generate notes",
          });
        }
      },
    );
