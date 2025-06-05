import { getBillingPortalUrl } from "@qahwa/landing/functions/auth";
import { useSubscription } from "@qahwa/landing/hooks/subscription";
import { Button } from "@qahwa/ui/components/button";
import { cn } from "@qahwa/ui/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import type { ComponentPropsWithoutRef } from "react";
import { BillingPortalButton } from "./billing-portal-button";

interface BillingTabProps extends ComponentPropsWithoutRef<"div"> { }

export function BillingTab({ className, ...props }: BillingTabProps) {
  return (
    <div className={cn(className)} {...props}>
      <h1>Billing</h1>
      <BillingPortalButton>Manage Billing</BillingPortalButton>
    </div>
  )
}
