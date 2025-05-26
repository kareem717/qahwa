import { signIn } from "@note/landing/lib/auth-client"; //import the auth client
import { Button } from "@note/ui/components/button";
import { type ComponentPropsWithRef, useState } from "react";

interface SignInButtonProps extends ComponentPropsWithRef<typeof Button> {
  provider: "google";
  redirect?: string
}

export function SignInButton({ className, provider, redirect = import.meta.env.VITE_APP_URL, children = "Sign In", ...props }: SignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin() {
    setIsLoading(true)

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
      callbackURL: redirect,
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
      fetchOptions: {
        onError: (error) => {
          setIsLoading(false)
          console.error(error)
        }
      }
    });
  }

  return (
    <Button
      onClick={handleLogin}
      className={className}
      {...props}
      disabled={isLoading}
    >
      {children}
    </Button>
  );
}
