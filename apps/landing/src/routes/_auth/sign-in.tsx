import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSessionFunction } from "../../functions/auth";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { SignInForm } from "@qahwa/landing/components/auth/sign-in-form";

export const Route = createFileRoute("/_auth/sign-in")({
  component: RouteComponent,
  beforeLoad: async () => {
    const { data } = await getSessionFunction();

    if (data) {
      throw redirect({
        to: "/",
      });
    }
  },
  validateSearch: zodValidator(
    z.object({
      redirect: z.string().optional(),
    }),
  ),
});

function RouteComponent() {
  const { redirect } = Route.useSearch();

  return <SignInForm redirect={redirect} />;
}
