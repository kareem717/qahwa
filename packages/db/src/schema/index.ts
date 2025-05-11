import { sql } from "drizzle-orm";
import { jsonb, pgTable, timestamp, text, serial, varchar, integer } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const notes = pgTable(
  "notes",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
    title: text(),
    transcript: jsonb().$type<{
      me: string,
      them: string,
    }[]>(),
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

export * as auth from "./auth";