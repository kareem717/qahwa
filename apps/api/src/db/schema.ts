import { sql } from "drizzle-orm";
import { jsonb, pgTable, timestamp, text, uuid } from "drizzle-orm/pg-core";

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text().notNull(),
    transcript: jsonb().$type<{
      me: string,
      them: string,
    }[]>().notNull(),
    userNotes: jsonb().notNull(),
    generatedNotes: jsonb().notNull(),
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
    ).notNull().$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
  }
);

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;