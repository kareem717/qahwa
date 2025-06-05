import { Button } from "../button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../avatar";
import { cn } from "../../lib/utils";
import type { ComponentPropsWithoutRef } from "react";
import type { AuthUser } from "@qahwa/auth/types";

interface UserButtonProps
  extends ComponentPropsWithoutRef<typeof Button> {
  user: AuthUser
}

// TODO: not sure why image not showing up
export function UserButton({ className, user, ...props }: UserButtonProps) {
  const { name, image, email } = user;

  const [firstName = "", lastName = ""] = (name ?? "").split(" ");
  const firstInitial = firstName[0] ?? "";
  const lastInitial = lastName[0] ?? "";
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();

  return (
    <Button
      size="icon"
      variant="ghost"
      className={cn(
        "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-full hover:cursor-pointer",
        className,
      )}
      {...props}
    >
      <Avatar className="size-7">
        {!!image && <AvatarImage src={image} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    </Button>
  );
}
