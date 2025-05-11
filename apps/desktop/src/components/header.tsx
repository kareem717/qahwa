import React from "react";
import { cn } from "@note/ui/lib/utils";
import { SearchCommandBar } from "./search-command-bar";
import { NavigateBack } from "./navigate-back";

interface HeaderProps extends React.ComponentProps<"header"> {
  leftTag?: React.ReactNode;
}

export function Header({ className, leftTag, children = (<></>), ...props }: HeaderProps) {
  return (
    <header className={cn("h-[41.5px] pl-22 pr-2 fixed top-0 left-0 right-0 border-b bg-background flex items-center justify-between", className)} {...props}>
      <div className="flex items-center gap-2">
        <NavigateBack />
        {leftTag}
      </div>
      <SearchCommandBar className="absolute left-1/2 -translate-x-1/2" />
      {children}
    </header>
  )
}