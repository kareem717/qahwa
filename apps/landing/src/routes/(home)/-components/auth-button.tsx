import { useSession } from "@qahwa/landing/lib/auth-client";
import { type Button, buttonVariants } from "@qahwa/ui/components/button";
import { cn } from "@qahwa/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

export function AuthButton({ className, ...props }: ComponentPropsWithoutRef<typeof Button>) {
  const { data: session, isPending, error } = useSession();

  if (error) {
    return <div>Error</div>;
  }

  return (
    <Link
      className={cn(buttonVariants({ size: "sm" }), "w-min h-7 text-xs", className)}
      to={session ? "/dashboard" : "/sign-in"}
      search={session ? { tab: "dashboard" } : undefined}
      preload={session ? "intent" : "render"}
    >
      {isPending
        ? <Loader2 className="size-4 animate-spin" />
        : session
          ? "Dashboard"
          : "Sign in"
      }
    </Link>
  )
}