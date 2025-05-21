import React from "react";
import { useLiveQuery, useOptimisticMutation } from "@tanstack/react-db";
import { fullNoteCollection, notesCollection } from "../lib/collections/notes";
import { useStore } from "@tanstack/react-store";
import { noteIdStore } from "../hooks/use-note-id";
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown';
import { cn } from "@note/ui/lib/utils";
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
  Markdown,
];

export function GeneratedNoteEditor({ className, onClick, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const noteId = useStore(noteIdStore, store => store.noteId)
  const noteCollection = fullNoteCollection(noteId)

  const { data } = useLiveQuery((query) =>
    query
      .from({ noteCollection })
      .select("@*")
      .keyBy("@id")
  )

  const editor = useEditor({
    extensions,
    autofocus: "start",
    immediatelyRender: false,
    content: data?.[0]?.generatedNotes ?? undefined,
    editable: false,
  })

  React.useEffect(() => {
    if (editor && typeof data?.[0]?.generatedNotes === 'string') {
      editor.commands.setContent(data[0].generatedNotes);
    }
  }, [data, editor])

  if (!editor) {
    return null;
  }



  return (
    <div
      onClick={(e) => {
        // e.stopPropagation()
        editor?.chain().focus().run();
        onClick?.(e)
      }}
      className={cn("cursor-text min-h-[18rem] bg-none", className)}
      {...props}
    >
      <EditorContent className="outline-none" editor={editor} />
    </div>
  );
}
