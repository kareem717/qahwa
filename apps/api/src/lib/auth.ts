import { createServerClient } from '@note/auth/server'
import { env } from 'cloudflare:workers'

export const createAuthClient = () => createServerClient({
  basePath: '/auth',
  databaseUrl: env.DATABASE_URL,
  trustedOrigins: [env.ELECTRON_URL, env.LANDING_URL],
  googleClientId: env.GOOGLE_CLIENT_ID,
  googleClientSecret: env.GOOGLE_CLIENT_SECRET,
})