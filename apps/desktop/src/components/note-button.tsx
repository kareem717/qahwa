import React from "react"
import { ChevronRight, FileText, Loader2, Trash } from "lucide-react"
import { Note } from "@note/db/types"
import { Button } from "@note/ui/components/button"
import { cn } from "@note/ui/lib/utils"
import { toast } from "sonner"
import { Link } from "@tanstack/react-router"
import { getClient } from "../lib/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { NOTE_QUERY_KEY } from "../hooks/use-note"
export type SimpleNote = Pick<Note, "id" | "title" | "updatedAt">

interface NoteButtonProps extends Omit<React.ComponentPropsWithoutRef<typeof Link>, "to" | "params"> {
  note: SimpleNote
}

// TODO: doesn't shrink all the way
export function NoteButton({ className, note, ...props }: NoteButtonProps) {
  const queryClient = useQueryClient()
  const { mutateAsync: deleteNote, isPending } = useMutation({
    mutationFn: async () => {
      const api = await getClient()
      await api.note[":id"].$delete({
        param: {
          id: note.id.toString()
        }
      })
    },
    onSuccess: () => {
      toast.success("Note deleted")
      queryClient.invalidateQueries({ queryKey: [NOTE_QUERY_KEY] })
    },
    onError: () => {
      toast.error("Failed to delete note")
    }
  })

  const updatedClockTime = new Date(note.updatedAt)
    .toLocaleTimeString(
      'en-US',
      { hour: '2-digit', minute: '2-digit' }
    )

  return (
    <Link
      {...props}
      to="/_authenticated/note"
      search={{
        id: note.id,
      }}
      className={
        cn(
          "group flex items-center justify-between w-full p-3 rounded-sm hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 h-16",
          className
        )
      }
    >
      <div className="flex flex-1 items-center gap-4 min-w-0">
        <div className="bg-primary/30 rounded-sm aspect-square size-10 flex items-center justify-center">
          <FileText className="text-primary size-5 stroke-[1.5px]" />
        </div>
        <div className="flex-1 overflow-hidden min-w-0">
          <p className="font-medium truncate min-w-0">{note.title}</p>
          <p className="text-xs text-muted-foreground">{updatedClockTime}</p>
        </div>
      </div>
      <div className="group-hover:flex hidden items-center pl-8 pr-2 gap-4 justify-center text-muted-foreground">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            deleteNote()
          }}
          disabled={isPending}
        >
          {isPending && <Loader2 className="size-4 animate-spin mr-2" />}
          <Trash className="size-4" />
        </Button>
        <ChevronRight className="size-4 hover:text-accent-foreground" />
      </div>
    </Link>
  )
}
