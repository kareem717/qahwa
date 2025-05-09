import { signIn  } from "@note/landing/lib/auth-client"; //import the auth client
import { Button } from "@note/ui/components/button";
import { ComponentPropsWithRef } from "react";
import { cn } from "@note/ui/lib/utils";

interface LoginButtonProps extends ComponentPropsWithRef<typeof Button> {
  provider: "google";
} 

export function LoginButton({ className, provider, ...props }: LoginButtonProps) {
  async function handleLogin() {

    await signIn.social({
      /**
       * The social provider id
       * @example "github", "google", "apple"
       */
      provider: provider,
      /**
       * A URL to redirect after the user authenticates with the provider
       * @default "/"
       */
      callbackURL: "http://localhost:3000/",
      /**
       * A URL to redirect if an error occurs during the sign in process
       */
      // errorCallbackURL: "/error",
      /**
       * A URL to redirect if the user is newly registered
       */
      newUserCallbackURL: "/welcome",
      /**
       * disable the automatic redirect to the provider. 
       * @default false
       */
      // disableRedirect: true,
    });
  }

  return <Button onClick={handleLogin} className={cn(className)} {...props}>Login</Button>;
}
