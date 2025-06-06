import { Hono } from "hono";
import { createAuthClient } from "../lib/auth";
import { getAuth, withAuth } from "../lib/middleware/with-auth";
import Stripe from "stripe";
import { env } from "cloudflare:workers";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const APP_API_KEY_NAME = "app";

export const authHandler = () =>
  new Hono()
    .use("*", withAuth())
    .get(
      "/get-session", // overrides built-in better-auth handler
      (c) => {
        const { session, user } = getAuth(c);

        return session && user
          ? c.json({
              session,
              user,
            })
          : c.json(null);
      },
    )
    .post("/sign-out", async (c) => {
      const { session, client } = getAuth(c);

      if (!session) {
        return c.json(
          {
            error: "Unauthorized",
          },
          401,
        );
      }

      try {
        await client.api.signOut({
          headers: c.req.raw.headers,
        });

        return c.json({
          success: true,
        });
      } catch (error) {
        c.get("sentry").captureException(error, {
          captureContext: {
            extra: {
              sessionId: session.id,
            },
          },
        });

        return c.json(
          {
            error: "Failed to sign out",
          },
          500,
        );
      }
    })
    .get("/key", async (c) => {
      const { session, client } = getAuth(c);

      if (!session) {
        return c.json(
          {
            error: "Unauthorized",
          },
          401,
        );
      }

      let existingApiKeys = [];
      try {
        existingApiKeys = await client.api.listApiKeys({
          headers: c.req.raw.headers,
        });
      } catch (error) {
        c.get("sentry").captureException(error, {
          captureContext: {
            extra: {
              sessionId: session.id,
            },
          },
        });

        return c.json(
          {
            error: "Failed to list API keys",
          },
          500,
        );
      }

      const existingAppKey = existingApiKeys.find(
        (key) => key.name === APP_API_KEY_NAME,
      );

      if (existingAppKey) {
        try {
          // We delete the original one because better auth doesn't expose the actual key value
          // we can access it through drizzle but I think that's bad practice
          await client.api.deleteApiKey({
            body: {
              keyId: existingAppKey.id,
            },
            headers: c.req.raw.headers,
          });
        } catch (error) {
          c.get("sentry").captureException(error, {
            captureContext: {
              extra: {
                existingAppKeyId: existingAppKey.id,
                sessionId: session.id,
              },
            },
          });

          return c.json(
            {
              error: "Failed to delete API key",
            },
            500,
          );
        }
      }

      try {
        const newApiKey = await client.api.createApiKey({
          body: {
            name: APP_API_KEY_NAME,
            userId: session.userId,
          },
        });

        return c.json({
          key: newApiKey.key,
        });
      } catch (error) {
        c.get("sentry").captureException(error, {
          captureContext: {
            extra: {
              sessionId: session.id,
            },
          },
        });

        return c.json(
          {
            error: "Failed to create API key",
          },
          500,
        );
      }
    })
    .get(
      "/billing-portal",
      zValidator(
        "query",
        z.object({
          returnUrl: z.string().url(),
        }),
      ),
      async (c) => {
        const { session, user } = getAuth(c);

        if (!session || !user) {
          return c.json(
            {
              error: "Unauthorized",
            },
            401,
          );
        }

        const customerId = await user.stripeCustomerId;

        if (!customerId) {
          c.get("sentry").captureMessage("No customer id found", "debug");
          return c.json(
            {
              error: "No customer id found",
            },
            500,
          );
        }

        const stripe = new Stripe(env.STRIPE_SECRET_KEY);

        const { url } = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: c.req.query("returnUrl"),
        });

        return c.json({ url });
      },
    )
    .on(["POST", "GET"], "/*", (c) => createAuthClient().handler(c.req.raw));
