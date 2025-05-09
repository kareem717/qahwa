import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: serial().primaryKey(),
  name: text().notNull(),
  email: varchar({ length: 360 }).notNull().unique(),
  emailVerified: boolean().notNull(),
  image: text(),
  createdAt: timestamp({
    mode: "string",
    withTimezone: true,
  }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp({
    mode: "string",
    withTimezone: true,
  }).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});

export const session = pgTable("session", {
  id: serial("id").primaryKey(),
  expiresAt: timestamp({
    mode: "string",
    withTimezone: true,
  }).notNull(),
  ipAddress: text(),
  userAgent: text(),
  userId: integer()
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: serial().primaryKey(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: integer()
    .notNull()
    .references(() => user.id),
  accessToken: text().notNull(),
  refreshToken: text().notNull(),
  idToken: text().notNull(),
  expiresAt: timestamp({
    mode: "string",
    withTimezone: true,
  }).notNull(),
  password: text().notNull(),
});

export const verification = pgTable("verification", {
  id: serial().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({
    mode: "string",
    withTimezone: true,
  }).notNull(),
});