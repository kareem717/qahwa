import { Outlet, createFileRoute } from "@tanstack/react-router";
import { NavBack } from "@qahwa/landing/components/nav-back";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

export function AuthLayout() {
  return (
    <div className="h-screen w-full flex justify-center items-center bg-accent p-4 relative">
      <NavBack className="absolute top-4 left-4" />
      <Outlet />
    </div>
  );
}
