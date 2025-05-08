import { createSelectSchema } from "drizzle-zod";
import { waitlistEmail } from "./schema";

export const InsertWaitlistEmailSchema = createSelectSchema(waitlistEmail).omit({
  createdAt: true,
  updatedAt: true,
}); 