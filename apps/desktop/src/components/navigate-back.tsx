import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@qahwa/ui/lib/utils";

//TODO: figure out how to calc if user can go back
export function NavigateBack({
  className,
  onClick,
  ...props
}: ComponentPropsWithoutRef<typeof ArrowLeft>) {
  const router = useRouter();
  
  return (
    <ArrowLeft
      className={cn(
        "size-5",
        router.history.canGoBack()
          ? "cursor-pointer"
          : "text-muted-foreground cursor-not-allowed",
      )}
      onClick={(e) => {
        e.preventDefault();
        router.history.back();
        onClick?.(e);
      }}
      {...props}
    />
  );
}
