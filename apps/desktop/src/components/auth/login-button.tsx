import { Button } from "@qahwa/ui/components/button";
import { cn } from "@qahwa/ui/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

interface LoginButtonProps extends ComponentPropsWithoutRef<typeof Button> {
  onLogin?: () => void;
}

export function LoginButton({
  onLogin,
  className,
  ...props
}: LoginButtonProps) {
  function handleLogin() {
    window.electronAuth.openSignInWindow();
    onLogin?.();
  }

  return (
    <Button onClick={handleLogin} className={cn(className)} {...props}>
      Login
    </Button>
  );
}
