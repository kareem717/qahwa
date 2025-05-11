import { Hono } from 'hono'
import { withAuth } from '../lib/middleware/with-auth';
import { HTTPException } from 'hono/http-exception';
import { env } from 'cloudflare:workers';
import { AssemblyAI } from 'assemblyai';

export const transcriptionHandler = () => new Hono()
  .use("*", withAuth())
  .get(
    "/token",
    async (c) => {
      const session = c.get("session")
      const user = c.get("user")

      if (!session || !user) {
        throw new HTTPException(401, {
          message: "Unauthorized",
        })
      }

      const assembly = new AssemblyAI({
        apiKey: env.ASSEMBLYAI_API_KEY,
      })

      const tempToken = await assembly.realtime.createTemporaryToken({
        expires_in: 60 // in seconds
      });

      return c.json({
        token: tempToken,
      })
    }
  )
