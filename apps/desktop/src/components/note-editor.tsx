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
import {
  useCallback,
  useRef,
  useEffect,
  type ComponentPropsWithoutRef,
} from "react";

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
  const isProgrammaticUpdate = useRef(false);

  const updateNote = useCallback(
    asyncDebounce(
      async (
        noteId: number,
        params: Partial<
          Pick<NoteType, "title" | "userNotes" | "generatedNotes">
        >,
      ) => {
        const api = await getClient();
        const resp = await api.note.$put({
          json: {
            id: noteId === DEFAULT_NOTE_ID ? undefined : noteId,
            ...params,
          },
        });

        if (!resp.ok) {
          throw new Error("Failed to update qahwa");
        }

        const { note } = await resp.json();

        return note;
      },
      {
        wait: 1500, // too low causes data inconsistency between collections
      },
    ),
    [],
  );

  const { mutate } = useOptimisticMutation({
    mutationFn: async ({ transaction }) => {
      const { changes: qahwa } = transaction.mutations[0];

      await updateNote(noteId, qahwa);

      // TODO: causes all of the notes in the collection to get the same updatedAt - or atleast I think its coming from here
      await noteCollection.invalidate();

      //TODO: For some reason this always chops a letter off the end of the title
      // seems to happe when the `wait` is set too low (i.e. 500ms)
      await notesCollection.invalidate();
    },
  });

  const { data } = useLiveQuery((query) =>
    query.from({ noteCollection }).select("@*").keyBy("@id"),
  );

  const editor = useEditor({
    extensions,
    autofocus: "start",
    immediatelyRender: true,
    // content: mode === 'user' ? (data?.[0]?.userNotes ?? undefined) : (data?.[0]?.generatedNotes ?? undefined),
    editable: mode === "user",
    onUpdate: (props) => {
      // Skip if this is a programmatic update (e.g., from mode switching)
      if (isProgrammaticUpdate.current) {
        return;
      }

      if (mode !== "user") {
        return;
      }

      const html = props.editor.getHTML();

      if (html) {
        const updatableRecord = noteCollection.state.get(noteId.toString());
        if (!updatableRecord) {
          // throw new Error(`[NoteEditor] qahwa with ID of ${noteId} qahwa found in the qahwa collection`)
          return;
        }
        mutate(() => {
          noteCollection.update(updatableRecord, (draft) => {
            draft.userNotes = html;
          });
        });
      }
    },
  });

  // Update editor content when data or mode changes
  useEffect(() => {
    if (!editor || !data || !data[0]) return;

    isProgrammaticUpdate.current = true;
    editor.commands.setContent(
      mode === "user" ? data[0].userNotes : data[0].generatedNotes,
    );

    // Reset the flag after a brief delay to allow the update to complete
    setTimeout(() => {
      isProgrammaticUpdate.current = false;
    }, 0);
  }, [data, mode, editor]);

  // Update editor editability when mode changes
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(mode === "user");
  }, [mode, editor]);

  if (!editor) {
    return null;
  }

  function handleTitleChange(title: string) {
    const updatableRecord = noteCollection.state.get(noteId.toString());
    if (!updatableRecord) {
      // throw new Error(`[NoteEditor] qahwa with ID of ${noteId} qahwa found in the qahwa collection`)
      return;
    }
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
        value={data?.[0]?.title}
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
