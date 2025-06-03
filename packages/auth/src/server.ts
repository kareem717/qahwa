import { getDb } from "@qahwa/db";
import { auth as AuthSchema } from "@qahwa/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI, apiKey } from "better-auth/plugins";
import { reactStartCookies } from "better-auth/react-start";

export const API_KEY_HEADER_NAME = 'x-api-key';

export const createServerClient = ({
  basePath,
  databaseUrl,
  trustedOrigins,
  googleClientId,
  googleClientSecret,
  baseDomain,
}: {
  basePath: string;
  databaseUrl: string;
  trustedOrigins: string[];
  googleClientId: string;
  googleClientSecret: string;
  baseDomain: string;
}) =>
  betterAuth({
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
      crossSubDomainCookies: {
        enabled: true,
        domain: `.${baseDomain}`, // Domain with a leading period
      },
      defaultCookieAttributes: {
        secure: true,
        httpOnly: true,
        sameSite: "none", // Allows CORS-based cookie sharing across subdomains
        partitioned: true, // New browser standards will mandate this for foreign cookies
      },
    },
    plugins: [
      openAPI({
        path: "/docs",
      }),
      apiKey({
        apiKeyHeaders: API_KEY_HEADER_NAME
      }),
      reactStartCookies(), // Has to be the last plugin
    ],
  });
