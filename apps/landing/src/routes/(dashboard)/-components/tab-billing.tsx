import { useClearSubscription, useSubscription } from "@qahwa/landing/hooks/subscription";
import { cn } from "@qahwa/ui/lib/utils";
import { useState, type ComponentPropsWithoutRef } from "react";
import { BillingPortalButton } from "./billing-portal-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@qahwa/ui/components/card";
import { Badge } from "@qahwa/ui/components/badge";
import { Separator } from "@qahwa/ui/components/separator";
import { ExternalLink, CreditCard, AlertCircle, Calendar, User } from "lucide-react";
import { authClient } from "@qahwa/landing/lib/auth-client";
import { Button } from "@qahwa/ui/components/button";
import { toast } from "sonner";
import { PlansDisplay } from "./plans-display";

interface BillingTabProps extends ComponentPropsWithoutRef<"div"> { }

export function BillingTab({ className, ...props }: BillingTabProps) {
  const { data: subscription, isLoading, error } = useSubscription();
  const [activeTab, setActiveTab] = useState<"current" | "plans">("current");

  console.log(error);
  // Helper function to format dates
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return null;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'trialing':
        return 'secondary';
      case 'canceled':
      case 'incomplete':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      <Separator />

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("current")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            activeTab === "current"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Current Subscription
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("plans")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            activeTab === "plans"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Available Plans
        </button>
      </div>

      {activeTab === "current" && (
        isLoading ? (
          <Card className="text-center">
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">Loading subscription details...</div>
            </div>
          </Card>
        ) : subscription ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Subscription</CardTitle>
                  <CardDescription>
                    Your current plan and subscription details
                  </CardDescription>
                </div>
                <Badge variant={getStatusVariant(subscription.status)} className="text-xs">
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-2xl font-medium capitalize">{subscription.plan} Plan</h3>
                 
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {subscription.periodStart && subscription.periodEnd && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Billing Period</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(subscription.periodStart)} - {formatDate(subscription.periodEnd)}
                        </p>
                      </div>
                    </div>
                  )}

                  {subscription.seats && (
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-muted-foreground mt-1" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Seats</p>
                        <p className="text-sm text-muted-foreground">
                          {subscription.seats} {subscription.seats === 1 ? 'seat' : 'seats'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {subscription.trialStart && subscription.trialEnd && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Trial Period</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(subscription.trialStart)} - {formatDate(subscription.trialEnd)}
                    </p>
                  </div>
                )}

                {subscription.cancelAtPeriodEnd && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Subscription Ending</p>
                        <p className="text-sm text-muted-foreground">
                          Your subscription will end on {formatDate(subscription.periodEnd)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <BillingPortalButton className="gap-2">
                <CreditCard className="h-4 w-4" />
                Manage Subscription
              </BillingPortalButton>
            </CardFooter>
          </Card>
        ) : (
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">No Active Subscription</h3>
                  <p className="text-muted-foreground max-w-md">
                    You don't have an active subscription. Subscribe to a plan to access premium features.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-center">
              <Button onClick={() => setActiveTab("plans")} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Plans
              </Button>
            </CardFooter>
          </Card>
        )
      )}

      {activeTab === "plans" && (
        <PlansDisplay />
      )}

      <div className="text-sm text-muted-foreground">
        <p>
          Need help with your billing? <button type="button" className="text-primary hover:underline">Contact support</button>
        </p>
      </div>
    </div>
  );
}
