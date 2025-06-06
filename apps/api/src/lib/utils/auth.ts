import { createServerClient } from "@qahwa/auth/server";
import { env } from "cloudflare:workers";

export const createAuthClient = () =>
  createServerClient({
    basePath: "/auth",
    databaseUrl: env.DATABASE_URL,
    trustedOrigins: [env.ELECTRON_URL, env.LANDING_URL],
    googleClientId: env.GOOGLE_CLIENT_ID,
    baseDomain: env.BASE_DOMAIN,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    stripeConfig: {
      apiKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
      env: env.NODE_ENV === "production" ? "production" : "sandbox",
    },
  });
