import type { StripePlan } from "@better-auth/stripe";
import type { createServerClient } from "./server";

type AuthInstance = ReturnType<typeof createServerClient>;

export type AuthUser = AuthInstance["$Infer"]["Session"]["user"];
export type AuthSession = AuthInstance["$Infer"]["Session"]["session"];

export type AuthType = {
  Variables: {
    user: AuthUser | null;
    session: AuthSession | null;
  };
};

export interface PricingPlan {
  name: string
  priceUsdCents: {
    monthly: number;
    yearly: number;
  }
  description: string
  features: string[]
  cta: string
  highlighted?: boolean
  popular?: boolean
}

export interface SubscriptionPlan {
  stripePlan: StripePlan;
  plan: PricingPlan
}