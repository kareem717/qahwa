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
import { sentry } from "@hono/sentry";

const ReleaseJsonSchema = z.object({
  currentRelease: z.string(),
  releases: z.array(z.object({
    version: z.string(),
    updateTo: z.object({
      name: z.string(),
      version: z.string(),
      pub_date: z.string(),
      url: z.string(),
      notes: z.string(),
    }),
  })),
});

const app = new Hono()
  .use('*', sentry({
    enabled: env.NODE_ENV === "production",
    environment: env.NODE_ENV,
    dsn: env.SENTRY_DSN,
  }), (c, next) => {
    c.get("sentry").setTag("path", c.req.path)
    return next()
  })
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
  .route("/note", noteHandler())
  .post(
    "/waitlist",
    zValidator("json", InsertWaitlistEmailSchema),
    async (c) => {
      const { email } = c.req.valid("json");
      const db = getDb(env.DATABASE_URL);

      try {
        await db.insert(waitlistEmail).values({ email });
      } catch (error) {
        c.get("sentry").captureException(error, {
          captureContext: {
            extra: {
              email,
            },
          },
        });
        return c.json({ error: "Failed to insert waitlist email" }, 500);
      }

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

      const key = `releases/${platform}/${arch}/RELEASES.json`;

      c.get("sentry").setContext("release", {
        platform,
        arch,
        key,
      })

      const releaseJson = await r2.get(key);

      if (releaseJson === null) {
        c.get("sentry").captureEvent({
          message: "RELEASES.json not found",
          level: "error",
        });
        return c.json({ error: "Release not found" }, 404);
      }

      const releaseJsonBody = await releaseJson.json();
      const { success, data, error } = ReleaseJsonSchema.safeParse(releaseJsonBody);

      if (!success) {
        c.get("sentry").captureEvent({
          message: "Invalid RELEASES.json format",
          level: "error",
          extra: {
            releaseJsonBody,
            zodError: error,
          },
        });
        return c.json({ error: "Invalid release JSON" }, 500);
      }

      const release = data.releases.find((release) => release.version === data.currentRelease);

      if (!release) {
        c.get("sentry").captureEvent({
          message: "Current release not in releases array",
          level: "error",
          extra: {
            releaseJsonBody,
          },
        });
        return c.json({ error: "Current release not in releases array" }, 500);
      }

      c.header("Cache-Control", "public, max-age=1800, s-maxage=1800"); // 30 minutes
      return c.redirect(release.updateTo.url, 302);
    },
  );

// We can technically use this to capture errors from the app, but it's not needed for now
// app.onError((err, c) => {
//   c.get("sentry").captureException(err);
//   return c.json({ error: "Internal server error" }, 500);
// });

export default app;
