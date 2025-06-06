import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../avatar";
import type { ComponentPropsWithoutRef } from "react";
import type { AuthUser } from "@qahwa/auth/types";
import { cn } from "../../lib/utils";

interface UserAvatarProps
  extends ComponentPropsWithoutRef<typeof Avatar> {
  user: AuthUser
}

// TODO: not sure why image not showing up
export function UserAvatar({ className, user, ...props }: UserAvatarProps) {
  const { name, image } = user;

  const [firstName = "", lastName = ""] = (name ?? "").split(" ");
  const firstInitial = firstName[0] ?? "";
  const lastInitial = lastName[0] ?? "";
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();

  return (
    <Avatar className={cn("size-7", className)} {...props}>
      {image && <AvatarImage src={image} />}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
