import type React from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@qahwa/ui/lib/utils";

//TODO: figure out how to calc if user can go back
export function NavigateBack({
  className,
  onClick,
  ...props
}: React.ComponentPropsWithoutRef<typeof ArrowLeft>) {
  const router = useRouter();

  function handleClick(e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
    e.preventDefault();
    router.history.back();
    onClick?.(e);
  }

  return (
    <ArrowLeft
      className={cn(
        "size-5",
        router.history.canGoBack()
          ? "cursor-pointer"
          : "text-muted-foreground cursor-not-allowed",
      )}
      onClick={handleClick}
      {...props}
    />
  );
}
