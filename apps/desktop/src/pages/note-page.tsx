import React from "react";
import { useNote } from "../hooks/use-note";
import { NoteRoute } from "../routes/routes";
import { Skeleton } from "@note/ui/components/skeleton";
import NoteEditor from "../components/note-editor";

export default function NotePage() {
  const { id } = NoteRoute.useSearch()
  const { data, isLoading } = useNote({
    noteId: id || 0,
    enabled: id !== undefined,
  })

  return (
    <div className="flex h-full flex-col items-center justify-center w-full">
      {isLoading ? (
        <Skeleton className="w-md h-80" />
      ) : (
        <NoteEditor initialData={data} />
      )}
    </div>
  );
}
