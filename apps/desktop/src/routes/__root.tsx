import React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import "@note/desktop/styles/app.css";

export const RootRoute = createRootRoute({
  component: Root,
});

function Root() {
  return (
    <Outlet />
  );
}
