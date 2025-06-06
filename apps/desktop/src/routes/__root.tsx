import { Outlet, createRootRoute } from "@tanstack/react-router";
import "@qahwa/desktop/styles/app.css";

export const RootRoute = createRootRoute({
  component: Root,
});

function Root() {
  return <Outlet />;
}
