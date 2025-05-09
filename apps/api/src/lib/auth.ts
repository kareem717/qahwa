import { getDb } from '@note/db'
import { auth as AuthSchema } from '@note/db/schema'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { env } from 'cloudflare:workers'

export const auth = betterAuth({
  database: drizzleAdapter(getDb(env.DATABASE_URL), {
    provider: 'pg',
    schema: {
      ...AuthSchema,
    },
  }),
  // Allow requests from the frontend development server
  trustedOrigins: [env.LANDING_URL, env.ELECTRON_URL],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_API_KEY,
      clientSecret: env.GOOGLE_API_KEY,
    },
  },
})

export type AuthType = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}