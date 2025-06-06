import { BadgeCheck, ArrowRight, Check, Loader2 } from "lucide-react";

import { cn } from "@qahwa/ui/lib/utils";
import { Badge } from "@qahwa/ui/components/badge";
import { Button } from "@qahwa/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@qahwa/ui/components/card";
import { authClient } from "@qahwa/landing/lib/auth-client";
import type { PricingPlan } from "@qahwa/auth/types";
import { useState, type ComponentPropsWithoutRef } from "react";
import { toast } from "sonner";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value / 100); // Convert cents to dollars
}

interface PlanCardProps extends ComponentPropsWithoutRef<typeof Card> {
  plan: PricingPlan;
  paymentFrequency?: "monthly" | "yearly";
  isCurrentPlan?: boolean;
}

export function PlanCard({
  plan,
  paymentFrequency = "monthly",
  isCurrentPlan,
}: PlanCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const price = plan.priceUsdCents[paymentFrequency];
  const isHighlighted = plan.highlighted;
  const isPopular = plan.popular;

  async function handleCheckout() {
    setIsLoading(true);
    if (isCurrentPlan) {
      return toast.info(`You are already on the ${plan.name} plan.`, {
        description: `You are already on the ${plan.name} plan. You can manage your subscription in the billing tab.`,
      });
    }

    const { data, error } = await authClient.subscription.upgrade({
      plan: plan.name,
      successUrl: window.location.href,
      cancelUrl: window.location.href,
    });

    if (error) {
      setIsLoading(false);
      return toast.error("Failed to redirect to checkout.", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    }

    return toast.info(`Redirecting to checkout for ${plan.name} plan...`, {
      description:
        "You will be redirected to the checkout page in a few seconds.",
    });
  }

  return (
    <Card
      className={cn(
        "relative flex flex-col gap-6 overflow-hidden p-6",
        isHighlighted
          ? "bg-foreground text-background"
          : "bg-background text-foreground",
        isPopular && "ring-2 ring-primary",
        isCurrentPlan && "ring-2 ring-green-500",
      )}
    >
      {isHighlighted && <HighlightedBackground />}
      {isPopular && <PopularBackground />}

      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium capitalize">{plan.name}</h2>
          <div className="flex gap-2">
            {isPopular && (
              <Badge variant="secondary" className="z-10">
                Popular
              </Badge>
            )}
            {isCurrentPlan && (
              <Badge
                variant="outline"
                className="border-green-500 text-green-500 z-10"
              >
                Current Plan
              </Badge>
            )}
          </div>
        </div>
        <div className="relative">
          {price > 0 ? (
            <>
              <span className="text-4xl font-medium">
                {formatCurrency(price)}
              </span>
              <p className="text-xs text-muted-foreground">
                Per {paymentFrequency === "monthly" ? "month" : "year"}/user
              </p>
            </>
          ) : (
            <span className="text-4xl font-medium">Free</span>
          )}
          {/* TODO: add a enterprise plan */}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="text-sm font-medium">{plan.description}</p>
        <ul className="space-y-3">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className={cn(
                "flex items-center gap-2 text-sm",
                isHighlighted ? "text-background" : "text-muted-foreground",
              )}
            >
              <BadgeCheck className="h-4 w-4 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          variant={
            isHighlighted ? "secondary" : isCurrentPlan ? "outline" : "default"
          }
          className="w-full"
          disabled={isCurrentPlan || isLoading}
          onClick={handleCheckout}
        >
          {isCurrentPlan ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Current Plan
            </>
          ) : (
            <>
              {isLoading && <Loader2 className="mr-1 size-4 animate-spin" />}
              {plan.cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

const HighlightedBackground = () => (
  <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:45px_45px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none" />
);

const PopularBackground = () => (
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))] pointer-events-none" />
);
