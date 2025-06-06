import { createFileRoute, redirect } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { DashboardSidebar } from "./-components/dashboard-sidebar";
import { BillingTab } from "./-components/tab-billing";
import { CreditCardIcon } from "lucide-react";
import { getSessionFunction } from "@qahwa/landing/functions/auth";
import { ScrollArea } from "@qahwa/ui/components/scroll-area";

export const DashboardTabs = {
  billing: {
    name: "Billing",
    component: BillingTab,
    icon: CreditCardIcon,
  },
} as const;

export type DashboardTabType = keyof typeof DashboardTabs;

export const Route = createFileRoute("/(dashboard)/dashboard")({
  component: RouteComponent,
  validateSearch: zodValidator(
    z.object({
      tab: fallback(
        z.enum(Object.keys(DashboardTabs) as [string, ...string[]]),
        "billing",
      ),
    }),
  ),
  beforeLoad: async ({ location }) => {
    //TODO: move to a cached fn, clear on sign out
    const { data } = await getSessionFunction();

    if (!data) {
      throw redirect({
        to: "/sign-in",
        search: {
          redirect: import.meta.env.VITE_APP_URL + location.href,
        },
      });
    }
    return {
      user: data.user,
    };
  },
});

function RouteComponent() {
  const { tab } = Route.useSearch();
  const { user } = Route.useRouteContext();
  const TabComponent = DashboardTabs[tab].component;

  return (
    <div className="flex h-full w-full">
      <DashboardSidebar currentTab={tab as DashboardTabType} user={user}>
        <ScrollArea className="mx-auto container h-screen">
          <TabComponent className="w-full p-4" />
        </ScrollArea>
      </DashboardSidebar>
    </div>
  );
}
