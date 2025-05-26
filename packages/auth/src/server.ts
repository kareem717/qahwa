import { getDb } from "@note/db";
import { auth as AuthSchema } from "@note/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI, apiKey } from "better-auth/plugins";
import { reactStartCookies } from "better-auth/react-start";

export const createServerClient = ({
  basePath,
  databaseUrl,
  trustedOrigins,
  googleClientId,
  googleClientSecret,
}: {
  basePath: string;
  databaseUrl: string;
  trustedOrigins: string[];
  googleClientId: string;
  googleClientSecret: string;
}) => {
  return betterAuth({
    basePath,
    database: drizzleAdapter(getDb(databaseUrl), {
      provider: "pg",
      schema: {
        ...AuthSchema,
      },
    }),
    // Allow requests from the frontend development server
    trustedOrigins,
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
        clientId: googleClientId,
        clientSecret: googleClientSecret,
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
      },
    },
    plugins: [
      openAPI({
        path: "/docs",
      }),
      apiKey(),
      reactStartCookies(), // Has to be the last plugin
    ],
  });
};
