import { getDb } from "@qahwa/db";
import { auth as AuthSchema } from "@qahwa/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI, apiKey } from "better-auth/plugins";
import { reactStartCookies } from "better-auth/react-start";
import { stripe } from "@better-auth/stripe"
import Stripe from "stripe"

export const API_KEY_HEADER_NAME = 'x-api-key';

interface StripeConfig {
  stripeClient: Stripe;
  stripeWebhookSecret: string;
  createCustomerOnSignUp: boolean;
}

interface ServerClientConfig {
  basePath: string;
  databaseUrl: string;
  trustedOrigins: string[];
  googleClientId: string;
  googleClientSecret: string;
  baseDomain: string;
  stripeConfig: {
    apiKey: string;
    webhookSecret: string;
    config?: Omit<Stripe.StripeConfig, "apiVersion">
  };
}

export const createServerClient = ({
  basePath,
  databaseUrl,
  trustedOrigins,
  googleClientId,
  googleClientSecret,
  baseDomain = "localhost",
  stripeConfig,
}: ServerClientConfig) => {
  const stripeClient = new Stripe(stripeConfig.apiKey, {
    apiVersion: "2025-05-28.basil",
    ...stripeConfig.config,
  })

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
        enabled: false, // causes sign-out to be weird on landing page
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
      stripe({
        stripeClient,
        stripeWebhookSecret: stripeConfig.webhookSecret,
        createCustomerOnSignUp: true,
        subscription: {
          enabled: true,
          plans: [
            {
              name: "basic", // the name of the plan, it'll be automatically lower cased when stored in the database
              priceId: "price_1234567890", // the price ID from stripe
              annualDiscountPriceId: "price_1234567890", // (optional) the price ID for annual billing with a discount
              limits: {
                projects: 5,
                storage: 10
              }
            },
            {
              name: "pro",
              priceId: "price_0987654321",
              limits: {
                projects: 20,
                storage: 50
              },
              freeTrial: {
                days: 14,
              }
            }
          ]
        },
        schema: {
          subscription: {
            modelName: "subscriptions",
          }
        }
      }),
      reactStartCookies(), // Has to be the last plugin
    ],
  });
}
