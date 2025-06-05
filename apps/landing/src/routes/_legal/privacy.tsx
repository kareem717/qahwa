import { createFileRoute, redirect } from "@tanstack/react-router";
import Privacy from "./-mdx/privacy.mdx";

export const Route = createFileRoute("/_legal/privacy")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Privacy />;
}
