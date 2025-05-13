import React from "react";
import { Textarea } from "@note/ui/components/textarea";
import { cn } from "@note/ui/lib/utils";
import { Input } from "@note/ui/components/input";
import { Note as NoteType } from "@note/db/types";
import { useDebounce } from "use-debounce";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NOTE_QUERY_KEY } from "../hooks/use-note";
import { toast } from "sonner";
import { getClient } from "../lib/api";

type Note = Partial<Pick<NoteType, "title" | "userNotes" | "transcript" | "id">>

// Helper function to compare relevant parts of the note
function relevantNotePartsAreEqual(noteA: Note | undefined, noteB: Note | undefined): boolean {
  if (!noteA && !noteB) return true;
  if (!noteA || !noteB) return false;
  // Compare only fields that are part of the upsert operation
  if (noteA.title !== noteB.title) return false;
  if (noteA.userNotes !== noteB.userNotes) return false;
  // For transcript array, a common pragmatic check if elements are simple and order matters:
  if (JSON.stringify(noteA.transcript) !== JSON.stringify(noteB.transcript)) return false;
  return true;
}

interface NoteEditorProps extends React.ComponentPropsWithoutRef<"div"> {
  initialData?: Note;
}

export function NoteEditor({ initialData, className, ...props }: NoteEditorProps) {
  const [note, setNote] = React.useState<Note>(initialData || {});
  const [debouncedNote] = useDebounce(note, 500);
  const queryClient = useQueryClient()
  const initialDataAtMountRef = React.useRef<Note>(initialData || {});
  const hasLoadedAndDebouncedOnceRef = React.useRef(false);

  const { mutateAsync: upsertNote, isPending } = useMutation({
    mutationFn: async (currentDebouncedNote: Note) => {
      const api = await getClient()
      const { id, title, userNotes, transcript } = currentDebouncedNote
      const response = await api.note.$put({
        json: {
          id: id ?? undefined,
          title: title ?? undefined,
          userNotes: userNotes ?? undefined,
          transcript: transcript ?? undefined,
        },
      })
      return await response.json()
    },
    onMutate: () => {
      toast.success("Saving note...")
    },
    onSuccess: ({ note }) => {
      toast.success("Note saved")
      queryClient.invalidateQueries({ queryKey: [NOTE_QUERY_KEY, note.id] })
    },
    onError: () => {
      toast.error("Failed to save note")
    }
  })

  //TODO: implement abort
  React.useEffect(() => {
    // const source = axios.CancelToken.source();
    // if (debouncedNote) {
    //   // getCountries(debouncedNote, source.token)
    //   //   .then(setCountries)
    //   //   .catch((e) => {
    //   //     if (axios.isCancel(source)) {
    //   //       return;
    //   //     }
    //   //     setCountries([]);
    //   //   });
    // } else {
    //   setCountries([]);
    // }x
    if (!hasLoadedAndDebouncedOnceRef.current) {
      hasLoadedAndDebouncedOnceRef.current = true;
      // Skip upsert on the very first debounce after mount
      return;
    }

    // Only upsert if the relevant content has actually changed from the initial state
    if (relevantNotePartsAreEqual(debouncedNote, initialDataAtMountRef.current)) {
      // Content is the same as initial (and it's not the first load's debounce), so don't save.
      return;
    }

    if (debouncedNote) {
      upsertNote(debouncedNote)
    }
    // return () => {
    //   // source.cancel(
    //   //   "Canceled because of component unmounted or debounce Text changed"
    //   // );
    // };
  }, [debouncedNote, upsertNote]); // Added upsertNote to dependency array

  // console.log(debouncedNote)
  return (
    <div
      className={cn(className)}
      {...props}
    >
      <Input
        placeholder="Title"
        className="w-full"
        value={note.title}
        onChange={(e) => setNote((prev) => ({ ...prev, title: e.target.value }))}
      />
      <Textarea
        value={note.userNotes as string}
        onChange={(e) => setNote((prev) => ({ ...prev, userNotes: e.target.value }))}
      />
      {isPending && <div>Saving...</div>}
    </div>

  );
}
