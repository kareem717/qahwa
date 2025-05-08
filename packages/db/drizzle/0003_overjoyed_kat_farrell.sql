CREATE TABLE "waitlist_email" (
	"email" varchar(360) PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
