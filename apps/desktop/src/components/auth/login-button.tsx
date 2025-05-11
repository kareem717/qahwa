import { Button } from '@note/ui/components/button';
import { cn } from '@note/ui/lib/utils';
import React from 'react';

interface LoginButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  onLogin?: () => void;
}

export function LoginButton({ onLogin, className, ...props }: LoginButtonProps) {

  function handleLogin() {
    window.electronAuth.openSignInWindow()
    onLogin?.()
  }

  return (
    <Button onClick={handleLogin} className={cn(className)} {...props}>
      Login
    </Button>
  );
}