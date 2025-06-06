import { getBillingPortalUrl } from "@qahwa/landing/functions/auth";
import { useSubscription } from "@qahwa/landing/hooks/subscription";
import { Button } from "@qahwa/ui/components/button";
import { cn } from "@qahwa/ui/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useState, type ComponentPropsWithoutRef } from "react";

interface BillingPortalButtonProps
  extends ComponentPropsWithoutRef<typeof Button> {}

export function BillingPortalButton({
  className,
  children,
  ...props
}: BillingPortalButtonProps) {
  const getUrl = useServerFn(getBillingPortalUrl);
  const [isLoading, setIsLoading] = useState(false);

  async function handleManageSubscription() {
    setIsLoading(true);
    try {
      const { url } = await getUrl({
        data: {
          returnUrl: window.location.href,
        },
      });

      window.location.href = url; // TODO: is there a better way to do this?
    } catch (error) {
      // TODO: add sentry error
      console.error("Failed to get billing portal url");
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <Button onClick={handleManageSubscription} disabled={isLoading} {...props}>
      {isLoading && <Loader2 className="size-4 animate-spin mr-2" />}
      {children}
    </Button>
  );
}
