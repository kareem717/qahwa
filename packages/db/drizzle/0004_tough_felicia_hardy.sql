ALTER TABLE "notes" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "transcript" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "transcript" SET NOT NULL;