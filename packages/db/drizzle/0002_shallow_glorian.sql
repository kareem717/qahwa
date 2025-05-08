ALTER TABLE "notes" ALTER COLUMN "userNotes" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "generatedNotes" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "updatedAt" DROP NOT NULL;