import React from "react";
import { Note as NoteType } from "@note/db/types";
import { getClient } from "../lib/api";
import { useLiveQuery, useOptimisticMutation } from "@tanstack/react-db";
import { fullNoteCollection, notesCollection } from "../lib/collections/notes";
import { asyncDebounce } from '@tanstack/pacer'
import { useStore } from "@tanstack/react-store";
import { noteIdStore, DEFAULT_NOTE_ID } from "../hooks/use-note-id";
import { useEditor, EditorContent, FloatingMenu, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const updateNote = asyncDebounce(async (noteId: number, params: Partial<Pick<NoteType, "title" | "userNotes">>) => {
  const api = await getClient()
  const resp = await api.note.$put({
    json: {
      id: noteId === DEFAULT_NOTE_ID ? undefined : noteId,
      ...params,
    },
  })

  if (!resp.ok) {
    throw new Error("Failed to update note")
  }

  const { note } = await resp.json()

  return note
}, {
  wait: 1500, // too low causes data inconsistency between collections
})

const extensions = [
  StarterKit.configure({
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal",
      },
    },
    bulletList: {
      HTMLAttributes: {
        class: "list-disc",
      },
    },
    code: {
      HTMLAttributes: {
        class: "bg-accent rounded-md p-1",
      },
    },
    horizontalRule: {
      HTMLAttributes: {
        class: "my-2",
      },
    },
    codeBlock: {
      HTMLAttributes: {
        class: "bg-primary text-primary-foreground p-2 text-sm rounded-md p-1",
      },
    },
    heading: {
      levels: [1, 2, 3, 4],
      HTMLAttributes: {
        class: "tiptap-heading",
      },
    },
  }),
];

export function NoteEditor({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const noteId = useStore(noteIdStore, store => store.noteId)
  const noteCollection = fullNoteCollection(noteId)

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

  const editor = useEditor({
    extensions,
    autofocus: "start",
    immediatelyRender: false,
    content: data?.[0]?.userNotes ?? undefined,
    onUpdate(props) {
      const html = props.editor.getHTML()

      if (html) {
        mutate(() => {
          noteCollection.update(noteCollection.state.get(noteId.toString())!, (draft) => {
            html ? draft.userNotes = html : undefined
          })
        })
      }
    },
  })

  if (!editor) {
    return null;
  }

  return (
    <div
      onClick={() => {
        editor?.chain().focus().run();
      }}
      className="cursor-text min-h-[18rem] bg-none"
    >
      <EditorContent className="outline-none" editor={editor} />
    </div>
  );
}
