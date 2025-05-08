import { sql } from "drizzle-orm";
import { jsonb, pgTable, timestamp, text, uuid, varchar } from "drizzle-orm/pg-core";

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text().notNull(),
    transcript: jsonb().$type<{
      me: string,
      them: string,
    }[]>().notNull(),
    userNotes: jsonb(),
    generatedNotes: jsonb(),
    createdAt: timestamp(
      {
        withTimezone: true,
        mode: "string",
      }
    )
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp(
      {
        withTimezone: true,
        mode: "string",
      }
    ).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  }
);


export const waitlistEmail = pgTable(
  "waitlist_email",
  {
    email: varchar({ length: 360 }).primaryKey(),
    createdAt: timestamp(
      {
        withTimezone: true,
        mode: "string",
      }
    )
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp(
      {
        withTimezone: true,
        mode: "string",
      }
    ).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  }
);


