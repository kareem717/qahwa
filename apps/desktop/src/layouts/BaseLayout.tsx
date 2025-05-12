import React from "react";
import { Header } from "../components/header";
import { Badge } from "@note/ui/components/badge";
import { UserButton } from "../components/auth/user-button";
import { ScrollArea } from "@note/ui/components/scroll-area";
import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@note/ui/components/button";
import { cn } from "@note/ui/lib/utils";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {

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
          <Link
            to="/note"
            className={
              cn(
                buttonVariants({
                  variant: "secondary",
                  size: "sm"
                }),
                "h-7 font-normal text-xs"
              )
            }
          >
            New Note
          </Link>
          <UserButton />
        </div>
      </Header>
      <main className="fixed top-[41.5px] w-full h-[calc(100vh-41.5px)] p-1">
        <ScrollArea className="h-full rounded-md border">
          {children}
        </ScrollArea>
      </main>
    </div>
  );
}
