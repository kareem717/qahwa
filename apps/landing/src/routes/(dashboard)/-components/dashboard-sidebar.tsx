import type { ComponentPropsWithoutRef } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@qahwa/ui/components/sidebar";
import { cn } from "@qahwa/ui/lib/utils";
import { DashboardTabs, type DashboardTabType } from "../dashboard";
import { Link } from "@tanstack/react-router";
import { SidebarUser } from "./sidebar-user";
import type { AuthUser } from "@qahwa/auth/types";
import { QahwaIcon } from "@qahwa/ui/components/icons";

interface DashboardSidebarProps
  extends ComponentPropsWithoutRef<typeof Sidebar> {
  currentTab: DashboardTabType;
  user: AuthUser;
}

export function DashboardSidebar({
  className,
  currentTab,
  user,
  ...props
}: DashboardSidebarProps) {
  return (
    <SidebarProvider className="items-start">
      <Sidebar
        collapsible="none"
        className={cn("hidden md:flex", className)}
        {...props}
      >
        <SidebarHeader>
          {/* <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild> */}
          <Link
            to="/dashboard"
            search={{
              tab: "", // sets to default tab
            }}
            className="w-min"
          >
            <QahwaIcon className="size-8" />
          </Link>
          {/* </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu> */}
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {Object.entries(DashboardTabs).map(([key, value]) => (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton asChild isActive={currentTab === key}>
                      <Link to={"/dashboard"} search={{ tab: key }}>
                        <value.icon />
                        <span>{value.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarUser user={user} className="w-full" />
        </SidebarFooter>
      </Sidebar>
      {props.children}
    </SidebarProvider>
  );
}
