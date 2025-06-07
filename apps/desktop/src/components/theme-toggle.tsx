import { Moon, Sun } from "lucide-react";
import {
  toggleTheme,
  getLocalTheme,
} from "@qahwa/desktop/lib/helpers/theme_helpers";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@qahwa/ui/components/toggle-group";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@qahwa/ui/lib/utils";

export function ToggleTheme({
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof ToggleGroup>, "type" | "defaultValue" | "onValueChange" | "value">) {
  const localTheme = getLocalTheme();
  return (
    <ToggleGroup
      type="single"
      defaultValue={localTheme ?? undefined}
      onValueChange={toggleTheme}
      className={cn("grid grid-cols-2 [&>*]:rounded-md gap-1", className)}
      {...props}
    >
      <ToggleGroupItem value="light">
        <Sun size={16} />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark">
        <Moon size={16} />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
