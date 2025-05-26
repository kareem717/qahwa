import { signOut } from "@note/landing/lib/auth-client"; //import the auth client
import { Button } from "@note/ui/components/button";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@note/ui/lib/utils";
import { useState } from "react";
import { Loader2 } from "lucide-react";

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
    await signOut({
      fetchOptions: {
        onError: (error) => {
          console.error(error);
        },
        onSuccess: () => {
          onSuccess?.();
        },
      },
    });
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
