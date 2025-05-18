import React from "react";
import { Textarea } from "@note/ui/components/textarea";
import { cn } from "@note/ui/lib/utils";
import { Input } from "@note/ui/components/input";
import { Note as NoteType } from "@note/db/types";
import { getClient } from "../lib/api";
import { useLiveQuery, useOptimisticMutation } from "@tanstack/react-db";
import { fullNoteCollection, notesCollection } from "../lib/collections/notes";
import { asyncDebounce } from '@tanstack/pacer'

interface NoteEditorProps extends React.ComponentPropsWithoutRef<"div"> {
  noteId: number
}

const updateNote = asyncDebounce(async (id: number, note: Partial<Pick<NoteType, "title" | "userNotes" | "transcript">>) => {
  const api = await getClient()
  const resp = await api.note[":id"].$patch({
    param: {
      id: id.toString(),
    },
    json: {
      title: note.title ?? undefined,
      userNotes: note.userNotes ?? undefined,
      transcript: note.transcript ?? undefined,
    },
  })

  const body = await resp.json()

  return body.note
}, {
  wait: 1500, // too low causes data inconsistency between collections
})

export function NoteEditor({ className, noteId, ...props }: NoteEditorProps) {
  const noteCollection = fullNoteCollection(noteId)
  const [isLoading, setIsLoading] = React.useState(true)
  noteCollection.stateWhenReady().then((state) => {
    setIsLoading(false)
  })

  const { data } = useLiveQuery((query) =>
    query
      .from({ noteCollection })
      .select("@*")
      .keyBy("@id")
  )

  const { mutate } = useOptimisticMutation({
    mutationFn: async ({ transaction }) => {
      const { changes: note } = transaction.mutations[0]!

      await updateNote(noteId, note)

      // TODO: causes all of the notes in the collection to get the same updatedAt - or atleast I think its coming from here
      await noteCollection.invalidate()

      //TODO: For some reason this always chops a letter off the end of the title
      // seems to happe when the `wait` is set too low (i.e. 500ms)
      await notesCollection.invalidate()
    },
  })


  // TODO: handle this better
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        Loading...
      </div>
    )
  }

  function handleChange(title?: string, userNotes?: string) {
    mutate(() => {
      noteCollection.update(noteCollection.state.get(noteId.toString())!, (draft) => {
        title ? draft.title = title : undefined
        userNotes ? draft.userNotes = userNotes : undefined
      })
      if (title) {
        notesCollection.update(notesCollection.state.get(noteId.toString())!, (draft) => {
          draft.title = title
          draft.updatedAt = new Date().toISOString() // for sorting
        })
      }
    })
  }

  const note = data[0]!
  return (
    <div
      className={cn(className)}
      {...props}
    >
      <Input
        placeholder="Title"
        className="w-full"
        value={note.title}
        onChange={(e) => handleChange(e.target.value)}
      />
      <Textarea
        value={note.userNotes ?? ""}
        onChange={(e) => handleChange(undefined, e.target.value)}
      />
      {/* {isPending && <div>Saving...</div>} */}
    </div>

  );
}
