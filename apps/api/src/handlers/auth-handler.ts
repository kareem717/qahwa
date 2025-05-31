import { Hono } from "hono";
import { createAuthClient } from "../lib/auth";
import { getAuth, withAuth } from "../lib/middleware/with-auth";

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
        console.error(error);

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
        console.error(error);

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
          console.error(error);

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
        console.error(error);

        return c.json(
          {
            error: "Failed to create API key",
          },
          500,
        );
      }
    })
    .on(["POST", "GET"], "/*", (c) => createAuthClient().handler(c.req.raw));
