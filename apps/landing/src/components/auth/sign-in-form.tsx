import { cn } from "@note/ui/lib/utils"
import { Button } from "@note/ui/components/button"
import { Card, CardContent } from "@note/ui/components/card"
import { Input } from "@note/ui/components/input"
import { Label } from "@note/ui/components/label"
import { ArrowRight } from "lucide-react"
import { GithubIcon, GoogleIcon } from "../icons"
import { SignInButton } from "./sign-in-button"

interface SignInFormProps extends React.ComponentPropsWithoutRef<"div"> {
  redirect?: string
}

export function SignInForm({
  className,
  redirect,
  ...props
}: SignInFormProps) {

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Sign in to your account
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SignInButton provider="google" variant="outline" type="button" className="w-full" redirect={redirect}>
                  <GoogleIcon className="size-4" />
                  <span className="sr-only">Login with Google</span>
                </SignInButton>
                <Button variant="outline" type="button" className="w-full" disabled>
                  <GithubIcon className="size-4" />
                  <span className="sr-only">Login with Meta</span>
                </Button>
              </div>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  disabled
                />
              </div>
              <Button type="submit" className="w-full" disabled>
                Continue with email <ArrowRight className="size-4" />
              </Button>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.png"
              alt="Placeholder PNG"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
