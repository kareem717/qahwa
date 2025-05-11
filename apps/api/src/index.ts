import { Hono } from 'hono'
import { env } from 'cloudflare:workers'
import { cors } from 'hono/cors'
import { authHandler } from './handlers/auth-handler'
import { transcriptionHandler } from './handlers/transcription-handler'

const app = new Hono()
  .use(
    "*",
    cors({
      origin: [env.LANDING_URL, env.ELECTRON_URL, `${env.DESKTOP_APP_PROTOCOL}://`],
      // allowHeaders: ["x-api-key"],
      credentials: true,
    })
  )
  .route('/auth', authHandler())
  .route('/transcription', transcriptionHandler())

export default app