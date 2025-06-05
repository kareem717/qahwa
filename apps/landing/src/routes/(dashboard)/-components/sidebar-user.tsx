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
import { UserButton } from "@qahwa/ui/components/custom/user-button";
import type { AuthUser } from "@qahwa/auth/types";
import type { ComponentPropsWithoutRef } from "react";
import { SidebarMenu, SidebarMenuItem } from "@qahwa/ui/components/sidebar";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface SidebarUserProps extends ComponentPropsWithoutRef<typeof SidebarMenu> {
  user: AuthUser
}

export function SidebarUser({ className, user, ...props }: SidebarUserProps) {
  return (
    <SidebarMenu {...props}>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2">
              <UserButton user={{
                ...user,
                createdAt: new Date(user.createdAt),
                updatedAt: new Date(user.updatedAt),
              }} />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  {user.name}
                </span>
                <span className="text-xs font-medium">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="size-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-full rounded-lg"
            // side={isMobile ? "bottom" : "right"}
            // side="bottom"
            align="end"
            // sideOffset={÷÷4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar>
                  {user.image && <AvatarImage src={user.image} />}
                  <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.name}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/sign-out">
                <LogOut className="size-4" />
                Sign out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>

  );
}
