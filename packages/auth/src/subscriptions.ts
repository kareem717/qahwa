import type { SubscriptionPlan } from "./types";

export const PRO_PLAN_NAME = "pro" as const;

export const SubscriptionPlans: (
  env?: "production" | "sandbox",
) => SubscriptionPlan[] = (env = "production") => [
  {
    stripePlan: {
      name: PRO_PLAN_NAME,
      priceId:
        env === "production"
          ? "price_1RWjhLGx8fNK3hsKM0HyjL3C"
          : "price_1RWjlG2ckbUlIrdP8HWVjfHA",
      annualDiscountPriceId:
        env === "production"
          ? "price_1RWjjLGx8fNK3hsKCFVfrnT8"
          : "price_1RWjlG2ckbUlIrdPEd6KcQQO",
      limits: {
        meetingMinutes: 60 * 40,
        noteGenerations: 100,
      },
    },
    plan: {
      priceUsdCents: {
        monthly: 2000,
        yearly: 19200,
      },
      name: "Pro",
      description: "Pro plan",
      features: [
        "40 hours of meeting transcription",
        "100 note AI generations",
      ],
      cta: "Get Pro",
      popular: true,
      highlighted: true,
    },
  },
];

// i don't like this either
export const FREE_TIER_LIMITS = {
  meetingMinutes: 60 * 1,
  noteGenerations: 10,
  titleGenerations: 10,
};
