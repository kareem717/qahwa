// biome-ignore lint/style/useImportType: Required for electron
import React from "react";
import { Button } from "@qahwa/ui/components/button";
import { useNoteGenerator } from "../hooks/use-note-generator";
import { cn } from "@qahwa/ui/lib/utils";
import { Loader2 } from "lucide-react";

export function NoteGenerator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Button>) {
  const { isGenerating, generate, canGenerate } = useNoteGenerator();

  async function handleClick() {
    await generate();
  }

  return (
    <Button
      className={cn("rounded-lg", className)}
      {...props}
      disabled={isGenerating || !canGenerate}
      onClick={handleClick}
    >
      {isGenerating && <Loader2 className="size-4 mr-2 animate-spin" />}
      Generate
    </Button>
  );
}
