ALTER TABLE "notes" RENAME COLUMN "content" TO "transcript";--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "userNotes" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "generatedNotes" jsonb NOT NULL;