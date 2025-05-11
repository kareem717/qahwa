import React from "react"
import { ChevronRight, FileText, Trash } from "lucide-react"
import { Note } from "@note/db/types"
import { Button } from "@note/ui/components/button"
import { cn } from "@note/ui/lib/utils"
import { toast } from "sonner"
import { Link } from "@tanstack/react-router"

interface NoteButtonProps extends Omit<React.ComponentPropsWithoutRef<typeof Link>, "to" | "params"> {
  note: Note
}

// TODO: doesn't shrink all the way
export function NoteButton({ className, note, ...props }: NoteButtonProps) {

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    toast.info("Delete not implemented")
  }

  const updatedClockTime = new Date(note.updatedAt || note.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  
  return (
    <Link
      to="/note/$id"
      // @ts-expect-error TypeScript isn't recognizing 'id' from the path string, likely due to global router type inference.
      params={{ id: note.id.toString() }}
      className={
        cn(
          "group flex items-center justify-between w-full p-3 rounded-sm hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 h-16",
          className
        )
      }
      {...props}
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
          onClick={handleDelete}
        >
          <Trash className="size-4" />
        </Button>
        <ChevronRight className="size-4 hover:text-accent-foreground" />
      </div>
    </Link>
  )
}
