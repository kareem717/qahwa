import { cn } from "@qahwa/ui/lib/utils";
import { Button } from "@qahwa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qahwa/ui/components/card";
import { LogIn } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

export function SignInForm({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.electronAuth.openSignInWindow()}
                >
                  <LogIn className="size-4" />
                  Sign in
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        {/* biome-ignore lint/a11y/useValidAnchor: <explanation> */}
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        {/* biome-ignore lint/a11y/useValidAnchor: <explanation> */}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
