import { Button } from "@qahwa/ui/components/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@qahwa/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@qahwa/ui/components/dropdown-menu";
import { LogOut } from "lucide-react";
import { useAuth } from "../../components/providers/auth-provider";
import { SignOutDialog } from "./sign-out-dialog";
import { UserAvatar } from "@qahwa/ui/components/custom/user-avatar";
import type { ComponentPropsWithoutRef } from "react";

interface UserButtonProps extends ComponentPropsWithoutRef<typeof Button> {}

// TODO: not sure why image not showing up
export function UserButton({ className }: UserButtonProps) {
  const { user } = useAuth();

  if (!user) {
    throw new Error("UserButton: no user");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-full hover:cursor-pointer"
        >
          <UserAvatar
            user={{
              ...user,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt),
            }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        // side={isMobile ? "bottom" : "right"}
        // side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar>
              {user.image && <AvatarImage src={user.image} />}
              <AvatarFallback>{user.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <SignOutDialog>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start font-normal"
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </SignOutDialog>
        </DropdownMenuItem>
        {/* <DropdownMenuSeparator />
        <DropdownMenuItem>
          TODO: notice how different this is from the logout button
          Control
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ModeToggle className="w-full" /> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
