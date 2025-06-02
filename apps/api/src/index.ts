import { Hono } from "hono";
import { env } from "cloudflare:workers";
import { cors } from "hono/cors";
import { authHandler } from "./handlers/auth-handler";
import { noteHandler } from "./handlers/note-handler";
import { waitlistEmail } from "@qahwa/db/schema";
import { zValidator } from "@hono/zod-validator";
import { InsertWaitlistEmailSchema } from "@qahwa/db/validation";
import { getDb } from "@qahwa/db";
import { z } from "zod";

const ReleaseJsonSchema = z.object({
  currentRelease: z.string(),
  releases: z.array(
    z.object({
      version: z.string(),
      updateTo: z.object({
        name: z.string(),
        version: z.string(),
        pub_date: z.string(),
        url: z.string(),
        notes: z.string(),
      }),
    }),
  ),
});

const app = new Hono()
  .use(
    "*",
    cors({
      origin: [
        env.LANDING_URL,
        env.ELECTRON_URL,
        `${env.DESKTOP_APP_PROTOCOL}://`,
      ],
      credentials: true,
    }),
  )
  .route("/auth", authHandler())
  .route("/qahwa", noteHandler())
  .post(
    "/waitlist",
    zValidator("json", InsertWaitlistEmailSchema),
    async (c) => {
      const { email } = c.req.valid("json");
      const db = getDb(env.DATABASE_URL);
      await db.insert(waitlistEmail).values({ email });
      return c.json({ success: true });
    },
  )
  .get(
    "/download/:platform/:arch",
    zValidator(
      "param",
      z.object({
        platform: z.enum(["darwin"]), // enums for future
        arch: z.enum(["arm64"]),
      }),
    ),
    async (c) => {
      const { platform, arch } = c.req.valid("param");
      const r2 = env.RELEASE_BUCKET;

      const releaseJson = await r2.get(
        `releases/${platform}/${arch}/RELEASES.json`,
      );

      if (releaseJson === null) {
        return c.json({ error: "Release not found" }, 404);
      }

      const releaseJsonBody = await releaseJson.json();
      const { success, data } = ReleaseJsonSchema.safeParse(releaseJsonBody);

      if (!success) {
        return c.json({ error: "Invalid release JSON" }, 500);
      }

      const release = data.releases.find(
        (release) => release.version === data.currentRelease,
      );

      if (!release) {
        return c.json({ error: "Current release not in releases array" }, 500);
      }

      c.header("Cache-Control", "public, max-age=1800, s-maxage=1800"); // 30 minutes
      return c.redirect(release.updateTo.url, 302);
    },
  );

export default app;
