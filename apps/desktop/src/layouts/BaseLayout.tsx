import React from "react";
import { Header } from "../components/header";
import { Badge } from "@note/ui/components/badge";
import { UserButton } from "../components/auth/user-button";
import { Button } from "@note/ui/components/button";
import { useAuth } from "../hooks/use-auth";
import { LoginButton } from "../components/auth/login-button";
import { LogoutDialog } from "../components/auth/logout-dialog";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const { data, isLoading, error } = useAuth()


  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="flex flex-col gap-4">
            <LoginButton />
            <LogoutDialog />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen relative">
      <Header
        leftTag={(
          <Badge variant="outline" className="text-muted-foreground tracking-wide font-mono text-xs px-1 h-5 rounded-sm">
            <span className="text-xs">BETA</span>
          </Badge>
        )}
      >
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" className="h-7 font-normal text-xs">
            New Note
          </Button>
          <UserButton />
        </div>
      </Header>
      <main className={"h-full pt-[41.5px]"}>{children}</main>
    </div>
  );
}
