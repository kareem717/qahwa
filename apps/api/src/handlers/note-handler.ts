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
import { stream } from "hono/streaming";
import type { Subscription } from "@qahwa/auth/types";
import {
  canGenerateNotes,
  canGenerateTitle,
  canTranscribe,
} from "../lib/utils/abac";

export const noteHandler = () =>
  new Hono()
    .use("*", withAuth())
    .get("/transcribe", async (c) => {
      const { session, client } = getAuth(c);

      if (!session || !client) {
        throw new HTTPException(401, {
          message: "Unauthorized",
        });
      }

      let subscriptions: Subscription[] = [];
      try {
        subscriptions = await client.api.listActiveSubscriptions({
          headers: c.req.raw.headers,
        });
      } catch (e) {
        c.get("sentry").captureException(e);
        throw new HTTPException(500, {
          message: "Failed to get subscription",
        });
      }

      const { success, error } = canTranscribe({
        subscriptions,
      });

      if (!success) {
        c.get("sentry").captureException(error, {
          captureContext: {
            extra: {
              subscriptions,
            },
          },
        });

        throw new HTTPException(403, {
          message: error.message,
        });
      }

      const assembly = new AssemblyAI({
        apiKey: env.ASSEMBLYAI_API_KEY,
      });

      let tempToken: string;
      try {
        tempToken = await assembly.realtime.createTemporaryToken({
          expires_in: 60, // in seconds
        });
      } catch (e) {
        c.get("sentry").captureException(e);

        throw new HTTPException(500, {
          message: "Failed to create temporary token",
        });
      }

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

      try {
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
      } catch (e) {
        c.get("sentry").captureException(e);

        throw new HTTPException(500, {
          message: "Failed to get user notes",
        });
      }
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

        let note: typeof notes.$inferSelect | null = null;
        try {
          [note] = await db.select().from(notes).where(eq(notes.id, id));
        } catch (e) {
          c.get("sentry").captureException(e);

          throw new HTTPException(500, {
            message: "Failed to get user notes",
          });
        }

        if (!note) {
          throw new HTTPException(404, {
            message: "Note not found",
          });
        }

        if (note.userId !== Number(user.id)) {
          c.get("sentry").captureMessage(
            "User attempted to access a note they don't own",
            "debug",
            {
              captureContext: {
                extra: {
                  noteUserId: note.userId,
                  // userId should already be set in the withAuth middleware
                },
              },
            },
          );

          throw new HTTPException(403, {
            message: "You are not allowed to access this qahwa",
          });
        }

        return c.json({
          note,
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

        let note: typeof notes.$inferSelect | null = null;
        try {
          [note] = await db
            .select()
            .from(notes)
            .where(and(eq(notes.id, id)));
        } catch (e) {
          c.get("sentry").captureException(e);
        }

        if (!note) {
          throw new HTTPException(404, {
            message: "qahwa not found",
          });
        }

        if (note.userId !== Number(user.id)) {
          c.get("sentry").captureMessage(
            "User attempted to delete a note they don't own",
            "debug",
            {
              captureContext: {
                extra: {
                  noteUserId: note.userId,
                  // userId should already be set in the withAuth middleware
                },
              },
            },
          );

          throw new HTTPException(403, {
            message: "You are not allowed to delete this qahwa",
          });
        }

        try {
          await db.delete(notes).where(eq(notes.id, id));
        } catch (e) {
          c.get("sentry").captureException(e, {
            captureContext: {
              extra: {
                requestedNoteId: id,
                noteUserId: note.userId,
                // userId should already be set in the withAuth middleware
              },
            },
          });

          throw new HTTPException(500, {
            message: "Failed to delete note",
          });
        }

        return c.body(null, 204);
      },
    )
    .put(
      "/",
      zValidator(
        "json",
        InsertNoteSchema.pick({
          id: true,
          title: true,
          transcript: true,
          userNotes: true,
        }).partial(),
      ),
      async (c) => {
        const { session, user, client } = getAuth(c);

        if (!session || !user || !client) {
          throw new HTTPException(401, {
            message: "Unauthorized",
          });
        }

        const { id, title, transcript, userNotes } = c.req.valid("json");

        const db = getDb(env.DATABASE_URL);

        // update note
        if (id) {
          try {
            const [note] = await db
              .update(notes)
              .set({
                title: title ?? undefined,
                transcript: transcript ?? undefined,
                userNotes: userNotes ?? undefined,
              })
              .where(and(eq(notes.id, id), eq(notes.userId, Number(user.id))))
              .returning();

            return c.json({
              note,
            });
          } catch (e) {
            c.get("sentry").captureException(e, {
              captureContext: {
                extra: {
                  noteId: id,
                },
              },
            });

            throw new HTTPException(500, {
              message: "Failed to update note",
            });
          }
        }

        if (!transcript && !userNotes) {
          c.get("sentry").captureMessage(
            "Note has no transcript or user notes",
            "debug",
          );

          // needed for a note to be created
          throw new HTTPException(400, {
            message: "Note has no transcript or user notes",
          });
        }

        let subscriptions: Subscription[] = [];
        try {
          subscriptions = await client.api.listActiveSubscriptions({
            headers: c.req.raw.headers,
          });
        } catch (e) {
          c.get("sentry").captureException(e);
          throw new HTTPException(500, {
            message: "Failed to get subscription",
          });
        }

        let insertableTitle = title;

        // generate title if not provided
        if (!insertableTitle) {
          // this is  kind of dumb - why do we allow the user to create MORE notes if they provide their own title?
          const { success, error } = canGenerateTitle({
            subscriptions,
          });

          if (!success) {
            if (error.isPlanRelated()) {
              insertableTitle = "Untitled Note";
            } else {
              c.get("sentry").captureException(error, {
                captureContext: {
                  extra: {
                    subscriptions,
                  },
                },
              });

              throw new HTTPException(403, {
                message: error.message,
              });
            }
          }

          try {
            // should this be metered?
            insertableTitle = await generateTitle(
              transcript ?? [],
              userNotes ?? undefined,
            );
          } catch (e) {
            c.get("sentry").captureException(e, {
              captureContext: {
                extra: {
                  transcriptLength: transcript?.length,
                  noteId: id,
                },
              },
            });

            throw new HTTPException(500, {
              message: "Failed to generate title",
            });
          }
        }

        // insert new note
        const [note] = await db
          .insert(notes)
          .values({
            userId: Number(user.id),
            title: insertableTitle,
            userNotes: userNotes ?? undefined,
            transcript: transcript ?? undefined,
          })
          .returning();

        return c.json({
          note,
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
        const { user, client } = getAuth(c);

        if (!user || !client) {
          throw new HTTPException(401, {
            message: "Unauthorized",
          });
        }

        let subscriptions: Subscription[] = [];
        try {
          subscriptions = await client.api.listActiveSubscriptions({
            headers: c.req.raw.headers,
          });
        } catch (e) {
          c.get("sentry").captureException(e);
          throw new HTTPException(500, {
            message: "Failed to get subscription",
          });
        }

        const { success, error } = canGenerateNotes({
          subscriptions,
        });

        if (!success) {
          c.get("sentry").captureException(error, {
            captureContext: {
              extra: {
                subscriptions,
              },
            },
          });

          throw new HTTPException(403, {
            message: error.message,
          });
        }

        const { id } = c.req.valid("param");

        const db = getDb(env.DATABASE_URL);

        let note: typeof notes.$inferSelect | null = null;
        try {
          [note] = await db.select().from(notes).where(eq(notes.id, id));
        } catch (e) {
          c.get("sentry").captureException(e);

          throw new HTTPException(500, {
            message: "Failed to get note",
          });
        }

        if (!note?.transcript) {
          c.get("sentry").captureMessage(
            "Note has no transcript to generate notes from",
            "debug",
            {
              captureContext: {
                extra: {
                  noteId: id,
                },
              },
            },
          );

          throw new HTTPException(400, {
            message: "qahwa has no transcript",
          });
        }

        if (note.userId !== Number(user.id)) {
          c.get("sentry").captureMessage(
            "User is not allowed to generate notes for this note",
            "debug",
            {
              captureContext: {
                extra: {
                  noteId: id,
                  noteUserId: note.userId,
                },
              },
            },
          );
          throw new HTTPException(403, {
            message: "You are not allowed to generate notes for this qahwa",
          });
        }

        let aiStreamResult: ReturnType<typeof generateNotes>;
        try {
          aiStreamResult = generateNotes(
            note.transcript,
            note.userNotes ?? undefined,
          );
        } catch (error) {
          c.get("sentry").captureException(error, {
            captureContext: {
              extra: {
                noteId: id,
              },
            },
          });

          throw new HTTPException(500, {
            message: "Failed to generate notes",
          });
        }

        // Schedule background task to save to DB after stream completion
        c.executionCtx.waitUntil(
          (async () => {
            let text: string;
            try {
              text = await aiStreamResult.text; // Wait for the full text
            } catch (e) {
              c.get("sentry").captureException(e, {
                captureContext: {
                  extra: {
                    noteId: id,
                  },
                },
              });
              return; // no point responding to the client
            }

            try {
              await db
                .update(notes)
                .set({
                  generatedNotes: text,
                })
                .where(eq(notes.id, id));
            } catch (e) {
              c.get("sentry").captureException(e, {
                captureContext: {
                  extra: {
                    noteId: id,
                  },
                },
              });
            }
          })(),
        );

        c.header("Content-Type", "text/plain; charset=utf-8");
        c.header("Content-Encoding", "Identity"); // Important for Cloudflare Workers

        return stream(c, async (honoStream) => {
          await honoStream.pipe(
            aiStreamResult.textStream.pipeThrough(
              new TextEncoderStream(), // not sure if this is needed
            ),
          );
        });
      },
    );
