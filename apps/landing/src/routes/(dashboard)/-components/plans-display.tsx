import { cn } from "@qahwa/ui/lib/utils";
import { Badge } from "@qahwa/ui/components/badge";
import { useSubscription } from "@qahwa/landing/hooks/subscription";
import { PlanCard } from "./plan-card";
import { toast } from "sonner";
import { SubscriptionPlans } from "@qahwa/auth/subscriptions";
import { type ComponentPropsWithoutRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@qahwa/ui/components/tabs";

interface PlansDisplayProps extends ComponentPropsWithoutRef<"div"> {
  title?: string;
  subtitle?: string;
}

const plans = Object.values(SubscriptionPlans)

export function PlansDisplay({
  title = "Choose Your Plan",
  subtitle = "Upgrade or change your subscription plan",
  className,
  ...props
}: PlansDisplayProps) {
  const { data: subscription } = useSubscription();
  const [selectedFrequency, setSelectedFrequency] = useState<"monthly" | "yearly">("monthly");



  return (
    <div className={cn("space-y-8", className)} {...props}>
      <div className="space-y-4 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{subtitle}</p>

        {/* Billing frequency toggle using shadcn tabs */}
        <Tabs
          defaultValue="monthly"
          value={selectedFrequency}
          onValueChange={(value) => setSelectedFrequency(value as "monthly" | "yearly")}
          className="w-fit mx-auto"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly" className="relative">
              Yearly
              <Badge variant="default" className="ml-2 text-xs">
                Save 20%
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plans grid */}
      <div className={cn(
        "grid gap-6 max-w-6xl mx-auto",
        plans.length % 3 === 0 ? "grid-cols-3" :
          plans.length % 2 === 0 ? "grid-cols-2" :
            "grid-cols-1"
      )}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.stripePlan.name}
            plan={plan.plan}
            paymentFrequency={selectedFrequency}
            isCurrentPlan={subscription?.plan === plan.stripePlan.name}
            className="w-full"
          />
        ))}
      </div>

      {/* Current subscription info */}
      {subscription && (
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Currently subscribed to <span className="font-medium capitalize">{subscription.plan}</span> plan
            {subscription.cancelAtPeriodEnd && subscription.periodEnd && (
              <span className="text-destructive"> (ends on {new Date(subscription.periodEnd).toLocaleDateString()})</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
} 