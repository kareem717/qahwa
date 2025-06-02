import { Button } from "@qahwa/ui/components/button";
// biome-ignore lint/style/useImportType: Required to import
import React from "react";
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
import { cn } from "@qahwa/ui/lib/utils";

interface UserButtonProps
  extends React.ComponentPropsWithoutRef<typeof Button> {}

// TODO: not sure why image not showing up
export function UserButton({ className, ...props }: UserButtonProps) {
  const { user } = useAuth();

  if (!user) {
    throw new Error("UserButton: no user");
  }

  const { name, image, email } = user;

  const firstName = name.split(" ")[0];
  const lastName = name.split(" ").slice(1).join(" ");
  const initials = (firstName[0] + lastName[0]).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
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
          {/* <ChevronsUpDown className="ml-auto size-4" /> */}
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
              {image && <AvatarImage src={image} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {firstName} {lastName}
              </span>
              <span className="truncate text-xs">{email}</span>
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
