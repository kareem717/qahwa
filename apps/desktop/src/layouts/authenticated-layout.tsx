import { useAuth } from "../components/providers/auth-provider";
import { useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isLoading, session } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="size-10 animate-spin" />
      </div>
    );
  }

  if (!session) {
    router.navigate({ to: "/sign-in" });
  }

  return <>{children}</>;
}
