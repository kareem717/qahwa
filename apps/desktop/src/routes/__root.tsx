import React from "react";
import BaseLayout from "@note/desktop/layouts/BaseLayout";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import "@note/ui/styles/globals.css";

export const RootRoute = createRootRoute({
  component: Root,
});

function Root() {
  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  );
}
