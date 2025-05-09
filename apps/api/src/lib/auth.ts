import { getDb } from '@note/db'
import { auth as AuthSchema } from '@note/db/schema'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { reactStartCookies } from 'better-auth/react-start'
import { env } from 'cloudflare:workers'

export const createAuth = () => {
  return betterAuth({
    basePath: "/auth",
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
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 7 days
      },
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
      modelName: "sessions",
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    verification: {
      modelName: "verifications",
    },
    account: {
      modelName: "accounts",
    },
    user: {
      modelName: "users",
    },
    advanced: {
      database: {
        generateId: false,
      }
    },
    plugins: [reactStartCookies()],
  })
}

// Infer types from the return type of createAuth
type AuthInstance = ReturnType<typeof createAuth>;

export type AuthType = {
  Variables: {
    user: AuthInstance['$Infer']['Session']['user'] | null
    session: AuthInstance['$Infer']['Session']['session'] | null
  }
}