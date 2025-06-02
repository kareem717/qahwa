import type React from "react";
import { ChevronRight, FileText, Loader2, Trash } from "lucide-react";
import type { qahwa } from "@qahwa/db/types";
import { Button } from "@qahwa/ui/components/button";
import { cn } from "@qahwa/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { getClient } from "../lib/api";
import { notesCollection } from "../lib/collections/notes";
import { useOptimisticMutation } from "@tanstack/react-db";
import { toast } from "sonner";

export type SimpleNote = Pick<qahwa, "id" | "title" | "updatedAt">;

interface NoteButtonProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Link>, "to" | "params"> {
  qahwa: SimpleNote;
}

// TODO: doesn't shrink all the way
export function NoteButton({
  className,
  qahwa: { id, title, updatedAt },
  ...props
}: NoteButtonProps) {
  const deleteNote = useOptimisticMutation({
    mutationFn: async () => {
      const api = await getClient();

      //todo: error handling
      await api.qahwa[":id"].$delete({
        param: {
          id: id.toString(),
        },
      });

      notesCollection.invalidate();
    },
  });

  const updatedClockTime = new Date(updatedAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      {...props}
      to="/qahwa"
      search={{
        id,
        title,
      }}
      className={cn(
        "group flex items-center justify-between w-full p-3 rounded-sm hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 h-16",
        className,
      )}
    >
      <div className="flex flex-1 items-center gap-4 min-w-0">
        <div className="bg-primary/30 rounded-sm aspect-square size-10 flex items-center justify-center">
          <FileText className="text-primary size-5 stroke-[1.5px]" />
        </div>
        <div className="flex-1 overflow-hidden min-w-0">
          <p className="font-medium truncate min-w-0">{title}</p>
          <p className="text-xs text-muted-foreground">{updatedClockTime}</p>
        </div>
      </div>
      <div className="group-hover:flex hidden items-center pl-8 pr-2 gap-4 justify-center text-muted-foreground">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            deleteNote.mutate(() => {
              const qahwa = Array.from(notesCollection.state.values()).find(
                (t) => t.id === id,
              );

              if (qahwa) {
                return notesCollection.delete(qahwa);
              }

              toast.error("qahwa not found");
            });
          }}
        >
          <Trash className="size-4" />
        </Button>
        <ChevronRight className="size-4 hover:text-accent-foreground" />
      </div>
    </Link>
  );
}
