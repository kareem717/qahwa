import React from "react";
import { useNote } from "../hooks/use-note";
import { NoteRoute } from "../routes/routes";
import { Skeleton } from "@note/ui/components/skeleton";
import { NoteEditor } from "../components/note-editor";
import { TranscriptRecorder } from "../components/transcript-recorder";
import { Header } from "../components/header";
import { ScrollArea } from "@note/ui/components/scroll-area";
import { AuthenticatedLayout } from "../layouts/authenticated-layout";

export default function NotePage() {
  const { id } = NoteRoute.useSearch()
  const { data, isLoading } = useNote({
    noteId: id || 0,
    enabled: id !== undefined,
  })

  return (
    <AuthenticatedLayout>
      <div className="relative h-screen ">
        <Header />
        <main className="fixed top-[41.5px] w-full h-[calc(100vh-41.5px)] p-1">
          <ScrollArea className="h-full rounded-md border bg-accent/50 p-4">
            {isLoading ? (
              <Skeleton className="w-md h-80" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full w-full relative">
                <NoteEditor initialData={data} />
                <TranscriptRecorder
                  initialData={{
                    transcript: data?.transcript,
                    id: data?.id
                  }}
                  className="fixed bottom-6 -translate-x-1/2 left-1/2 z-10"
                />
              </div>
            )}
          </ScrollArea>
        </main>
      </div>
    </AuthenticatedLayout>
  );
}
