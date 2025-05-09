ALTER TABLE "accounts" ADD COLUMN "access_token_expires_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "refresh_token_expires_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "scope" text NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "verifications" ADD COLUMN "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE "verifications" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "password";