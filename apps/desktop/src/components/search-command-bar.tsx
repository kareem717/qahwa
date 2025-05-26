import React from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@note/ui/components/command";
import {
  Calendar,
  Smile,
  Calculator,
  User,
  CreditCard,
  Settings,
  Search,
} from "lucide-react";
import { Button } from "@note/ui/components/button";
import { cn } from "@note/ui/lib/utils";

const COMMAND_KEY = "k";

export function SearchCommandBar({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === COMMAND_KEY && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);

    return () => document.removeEventListener("keydown", down);
  }, []);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    setOpen(true);
    props.onClick?.(e);
  }

  return (
    <>
      <Button
        variant="secondary"
        className={cn("h-7  hidden sm:flex w-70 md:w-sm relative", className)}
        {...props}
        onClick={handleClick}
      >
        <div className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          <Search className="size-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Search</span>
        </div>

        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted-foreground/20 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 ml-auto">
          <span className="text-xs">⌘</span>
          {COMMAND_KEY.toUpperCase()}
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>
              <Calendar />
              <span>Calendar</span>
            </CommandItem>
            <CommandItem>
              <Smile />
              <span>Search Emoji</span>
            </CommandItem>
            <CommandItem>
              <Calculator />
              <span>Calculator</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem>
              <User />
              <span>Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <CreditCard />
              <span>Billing</span>
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <Settings />
              <span>Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
