import { authClient, signOut } from "@qahwa/landing/lib/auth-client"; //import the auth client
import { Button } from "@qahwa/ui/components/button";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@qahwa/ui/lib/utils";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SignOutButtonProps extends ComponentPropsWithRef<typeof Button> {
  onSuccess?: () => void;
}

export function SignOutButton({
  className,
  onSuccess,
  ...props
}: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    const { data, error } = await signOut({
      fetchOptions: {
        onError: (error) => {
          console.error(error);
        },
      },
    });

    if (error) {
      console.error(error);
    }

    if (data?.success) {
      onSuccess?.();
    } else {
      //TODO: add sentry error
      toast.error("Failed to sign out");
    }

    setIsLoading(false);
  }

  return (
    <Button
      onClick={handleLogout}
      className={cn(className)}
      disabled={isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
      Logout
    </Button>
  );
}
