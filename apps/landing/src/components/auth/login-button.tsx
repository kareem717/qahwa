import { signIn } from "@note/landing/lib/auth-client"; //import the auth client
import { Button } from "@note/ui/components/button";
import { ComponentPropsWithRef } from "react";
import { cn } from "@note/ui/lib/utils";

interface LoginButtonProps extends ComponentPropsWithRef<typeof Button> {
  provider: "google";
  redirect?: "web" | "desktop"
}

export function LoginButton({ className, provider, redirect = "web", ...props }: LoginButtonProps) {
  async function handleLogin() {
    const callbackURL = import.meta.env.VITE_APP_URL + (redirect === "web" ? "" : "/app-redirect")

    await signIn.social({
      /**
       * The social provider id
       * @example "github", "google", "apple"
       */
      provider,
      /**
       * A URL to redirect after the user authenticates with the provider
       * @default "/"
       */
      callbackURL,
      /**
       * A URL to redirect if an error occurs during the sign in process
       */
      // errorCallbackURL: "/error",
      /**
       * A URL to redirect if the user is newly registered
       */
      // newUserCallbackURL: "note-app://",
      /**
       * disable the automatic redirect to the provider. 
       * @default false
       */
      // disableRedirect: true,
    });
  }

  return <Button onClick={handleLogin} className={cn(className)} {...props}>Login</Button>;
}
