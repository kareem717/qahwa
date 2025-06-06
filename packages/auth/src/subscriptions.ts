import type { SubscriptionPlan } from "./types";

export const SubscriptionPlans: (
  env?: "production" | "sandbox",
) => SubscriptionPlan[] = (env = "production") => [
  {
    stripePlan: {
      name: "pro",
      priceId:
        env === "production"
          ? "price_1RWjhLGx8fNK3hsKM0HyjL3C"
          : "price_1RWjlG2ckbUlIrdP8HWVjfHA",
      annualDiscountPriceId:
        env === "production"
          ? "price_1RWjjLGx8fNK3hsKCFVfrnT8"
          : "price_1RWjlG2ckbUlIrdPEd6KcQQO",
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
    },
  },
];
