import { createFileRoute, redirect } from "@tanstack/react-router";
import Terms from "./-mdx/terms.mdx";

export const Route = createFileRoute("/_legal/terms")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Terms />;
}
