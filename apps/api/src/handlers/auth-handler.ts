import { Hono } from 'hono'
import { createAuth } from '../lib/auth';
import { withAuth } from '../lib/middleware/with-auth';

export const authHandler = () => new Hono()
  .use("*", withAuth())
  .get(
    "/get-session", // overrides built-in better-auth handler
    (c) => {
      const session = c.get("session")
      const user = c.get("user")

      return session && user ? c.json({
        session,
        user,
      }) : c.json(null)
    })
  .on(["POST", "GET"], "/*", (c) => createAuth().handler(c.req.raw))