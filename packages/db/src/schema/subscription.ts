import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  plan: text("plan").notNull(),
  referenceId: text("reference_id"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull(),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end"),
  seats: integer("seats"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  createdAt: timestamp({
    withTimezone: true,
    mode: "string",
  })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp({
    withTimezone: true,
    mode: "string",
  })
    .notNull()
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});
