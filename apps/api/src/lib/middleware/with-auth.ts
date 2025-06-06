import { createMiddleware } from "hono/factory";
import { createAuthClient } from "../auth";
import type { Context } from "hono";
import type { AuthType } from "@qahwa/auth/types";
import { HTTPException } from "hono/http-exception";
import { API_KEY_HEADER_NAME } from "@qahwa/auth/server";

const AUTH_CLIENT_KEY = "authClient";
const SESSION_KEY = "session";
const USER_KEY = "user";

export const getAuth = (c: Context) => {
  const client = c.get(AUTH_CLIENT_KEY);
  const session = c.get(SESSION_KEY);
  const user = c.get(USER_KEY);

  if (!client || !session || !user) {
    return {
      client: null,
      session: null,
      user: null,
    };
  }

  return {
    client: client as ReturnType<typeof createAuthClient>,
    session: session as AuthType["Variables"]["session"],
    user: user as AuthType["Variables"]["user"],
  };
};

export const withAuth = () =>
  createMiddleware(async (c, next) => {
    const auth = createAuthClient();

    try {
      const resp = await auth.api.getSession({ headers: c.req.raw.headers });

      if (resp) {
        // set both or none
        c.get("sentry").setTags({
          userId: resp.user.id, // downstream heavily depends on this tag
          sessionId: resp.session.id,
        });

        c.set(USER_KEY, resp.user);
        c.set(SESSION_KEY, resp.session);
        c.set(AUTH_CLIENT_KEY, auth);
        return await next();
      }
    } catch (e) {
      c.get("sentry").captureException(e, {
        captureContext: {
          tags: {
            // if it failed, it should not be redacted as it is not a valid API key
            apiKeyHeaderValue: c.req.raw.headers.get(API_KEY_HEADER_NAME),
          },
          extra: {
            request: c.req.raw,
          },
        },
      });

      throw new HTTPException(500, {
        message: "Failed to get session",
      });
    }

    return await next();
  });
