import { Moon } from "lucide-react";
import { Button } from "@qahwa/ui/components/button";
import { toggleTheme } from "@qahwa/desktop/lib/helpers/theme_helpers";

export default function ToggleTheme() {
  return (
    <Button onClick={toggleTheme} size="icon">
      <Moon size={16} />
    </Button>
  );
}
