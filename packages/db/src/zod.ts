import { createSelectSchema } from "drizzle-zod";
import { notes, waitlistEmail } from "./schema";

export const InsertWaitlistEmailSchema = createSelectSchema(waitlistEmail).omit({
  createdAt: true,
  updatedAt: true,
}); 

export const InsertNoteSchema = createSelectSchema(notes).omit({
  createdAt: true,
  updatedAt: true,
});