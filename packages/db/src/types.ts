import type { notes } from "./schema";
import type { waitlistEmail } from "./schema";

export type InsertWaitlistEmail = typeof waitlistEmail.$inferInsert;

export type qahwa = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;
