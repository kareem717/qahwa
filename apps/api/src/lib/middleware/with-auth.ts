import { createMiddleware } from 'hono/factory'
import { createAuthClient } from '../auth';
import { Context } from 'hono';
import { AuthType } from '@note/auth/types';

/**
 * Extends Hono's Context to include user and account objects
 */
declare module "hono" {
  interface ContextVariableMap {
    user: AuthType["Variables"]["user"]
    session: AuthType["Variables"]["session"]
  }
}

export const getUser = (c: Context) => {
  return c.get("user");
};

export const getSession = (c: Context) => {
  return c.get("session");
};

export const withAuth = () => createMiddleware(async (c, next) => {
  const auth = createAuthClient()

  try {
    const resp = await auth.api.getSession({ headers: c.req.raw.headers })

    if (resp) {
      c.set("user", resp.user)
      c.set("session", resp.session)
      return await next()
    }

    c.set("user", null)
    c.set("session", null)
  } catch (e) {
    console.error(e)
    //TODO: handle error
    return c.json({ error: "Unauthorized" }, 401)
  }

});