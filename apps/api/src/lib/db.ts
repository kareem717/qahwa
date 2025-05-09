import { env } from "cloudflare:workers";
import { getDb } from "@note/db";

export const createDb = () => getDb(env.DATABASE_URL);
