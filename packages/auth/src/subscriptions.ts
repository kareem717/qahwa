import type { SubscriptionPlan } from "./types";

export const SubscriptionPlans: Readonly<Record<string, SubscriptionPlan>> = {
  pro: {
    stripePlan: {
      name: "pro",
      priceId: "price_1RWjlG2ckbUlIrdP8HWVjfHA",
      annualDiscountPriceId: "price_1RWjlG2ckbUlIrdPEd6KcQQO",
      limits: {
        minutes: 15,
      },
    },
    plan: {
      priceUsdCents: {
        monthly: 2000,
        yearly: 19200,
      },
      name: "Pro",
      description: "Pro plan",
      features: ["Feature 1", "Feature 2", "Feature 3"],
      cta: "Get Pro",
      popular: true,
      highlighted: true,
    }
  },
} as const;
