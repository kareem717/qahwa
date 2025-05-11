import { createMiddleware } from 'hono/factory'
import { AuthType, createAuth } from '../auth';
import { Context } from 'hono';

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
  const auth = createAuth()

  const resp = await auth.api.getSession({ headers: c.req.raw.headers })

  // console.log(await auth.api.getSession({ headers: c.req.raw.headers }))
  // console.log(c.req.raw.headers.get("authorization"))


  if (resp) {
    c.set("user", resp.user)
    c.set("session", resp.session)
    return await next()
  }

  c.set("user", null)
  c.set("session", null)

  await next();
});