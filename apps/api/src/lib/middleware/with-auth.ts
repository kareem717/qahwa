import { createMiddleware } from "hono/factory";
import { createAuthClient } from "../auth";
import type { Context } from "hono";
import type { AuthType } from "@note/auth/types";
import { HTTPException } from "hono/http-exception";

export const getAuth = (c: Context) => {
  const client = c.get("authClient");
  const session = c.get("session");
  const user = c.get("user");

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

    c.set("authClient", auth);

    try {
      const resp = await auth.api.getSession({ headers: c.req.raw.headers });

      if (resp) {
        c.set("user", resp.user);
        c.set("session", resp.session);
        return await next();
      }
    } catch (e) {
      console.error(e);

      throw new HTTPException(500, {
        message: "Failed to get session",
      });
    }

    return await next();
  });
