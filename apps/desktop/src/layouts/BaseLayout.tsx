import React from "react";
import { Header } from "../components/header";
import { Badge } from "@note/ui/components/badge";
import { UserButton } from "../components/auth/user-button";
import { Button } from "@note/ui/components/button";
export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="h-full relative">
      <Header leftTag={(
        <Badge variant="outline" className="text-muted-foreground tracking-wide font-mono text-xs px-1 h-5 rounded-sm">
          <span className="text-xs">BETA</span>
        </Badge>
      )}>
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" className="h-7 font-normal text-xs">
            New Note
          </Button>
          <UserButton />
        </div>
      </Header>
      <main className="h-full">{children}</main>
    </div>
  );
}
