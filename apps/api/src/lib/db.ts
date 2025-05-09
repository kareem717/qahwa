import { env } from "cloudflare:workers";
import { getDb } from "@note/db";

export const db = getDb(env.DATABASE_URL);
