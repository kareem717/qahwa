import type { Note as NoteType } from "@qahwa/db/types";
import { getClient } from "../lib/api";
import { useLiveQuery, useOptimisticMutation } from "@tanstack/react-db";
import { fullNoteCollection, notesCollection } from "../lib/collections/notes";
import { asyncDebounce } from "@tanstack/pacer";
import { useStore } from "@tanstack/react-store";
import { noteIdStore, DEFAULT_NOTE_ID } from "../hooks/use-note-id";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { cn } from "@qahwa/ui/lib/utils";
import { noteEditorModeStore } from "../hooks/use-note-editor";
import type { ComponentPropsWithoutRef } from "react";
import { useRef, useEffect, useCallback } from "react";

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

interface NoteEditorProps extends ComponentPropsWithoutRef<"div"> {
  noteEditorProps?: Omit<
    ComponentPropsWithoutRef<typeof EditorContent>,
    "editor"
  >;
}

export function NoteEditor({
  className,
  noteEditorProps,
  ...props
}: NoteEditorProps) {
  const noteId = useStore(noteIdStore, (store) => store.noteId);
  const noteCollection = fullNoteCollection(noteId);
  const mode = useStore(noteEditorModeStore, (store) => store.mode);

  const updateNote = asyncDebounce(
    async (
      noteId: number,
      params: Partial<Pick<NoteType, "title" | "userNotes" | "generatedNotes">>,
    ) => {
      const api = await getClient();
      const resp = await api.note.$put({
        json: {
          id: noteId === DEFAULT_NOTE_ID ? undefined : noteId,
          ...params,
        },
      });

      if (!resp.ok) {
        throw new Error("Failed to update note");
      }

      await notesCollection.invalidate();
    },
    { wait: 1500 },
  );

  const { mutate } = useOptimisticMutation({
    mutationFn: async ({ transaction }) => {
      const { changes: note } = transaction.mutations[0];
      await updateNote(noteId, note);
    },
  });

  const { data } = useLiveQuery((query) =>
    query.from({ noteCollection }).select("@*").keyBy("@id"),
  );

  const note = data?.[0];
  const editorContent =
    mode === "user" ? note?.userNotes : note?.generatedNotes;

  const editor = useEditor(
    {
      extensions,
      autofocus: "start",
      content: editorContent ?? "",
      editable: mode === "user",
      onUpdate: (props) => {
        if (mode !== "user") return;

        const html = props.editor.getHTML();
        const updatableRecord = noteCollection.state.get(noteId.toString());

        if (!updatableRecord) {
          throw new Error(`Note with ID ${noteId} not found in collection`);
        }

        mutate(() => {
          noteCollection.update(updatableRecord, (draft) => {
            draft.userNotes = html;
          });
        });
      },
    },
    [mode],
  );

  const hasInitialized = useRef(false);

  const updateEditorContent = useCallback(() => {
    if (editor && editorContent !== undefined) {
      editor.commands.setContent(editorContent);
    }
  }, [editor, editorContent]);

  useEffect(() => {
    if (note && !hasInitialized.current) {
      hasInitialized.current = true;
      updateEditorContent();
    }
  }, [note, updateEditorContent]);

  function handleTitleChange(title: string) {
    const updatableRecord = noteCollection.state.get(noteId.toString());
    if (!updatableRecord) return;

    mutate(() => {
      noteCollection.update(updatableRecord, (draft) => {
        draft.title = title;
      });
    });
  }

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      <input
        type="text"
        value={note?.title || ""}
        onChange={(e) => handleTitleChange(e.target.value)}
        className="text-2xl font-bold outline-none"
      />
      <EditorContent
        className={cn(
          "outline-none cursor-text min-h-[18rem] bg-none",
          noteEditorProps?.className,
        )}
        editor={editor}
        {...noteEditorProps}
      />
    </div>
  );
}
