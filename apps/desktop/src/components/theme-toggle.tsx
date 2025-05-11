import { Moon } from "lucide-react";
import React from "react";
import { Button } from "@note/ui/components/button";
import { toggleTheme } from "@note/desktop/lib/helpers/theme_helpers";

export default function ToggleTheme() {
  return (
    <Button onClick={toggleTheme} size="icon">
      <Moon size={16} />
    </Button>
  );
}
