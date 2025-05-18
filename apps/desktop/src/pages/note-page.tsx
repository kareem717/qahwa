import React from "react";
import { NoteRoute } from "../routes/routes";
import { NoteEditor } from "../components/note-editor";
import { Header } from "../components/header";
import { ScrollArea } from "@note/ui/components/scroll-area";
import { AuthenticatedLayout } from "../layouts/authenticated-layout";
import { TranscriptRecorder } from "../components/transcript-recorder";

export default function NotePage() {
  const search = NoteRoute.useSearch()
  const noteId = search.id ?? 0

  return (
    <AuthenticatedLayout>
      <div className="relative h-screen ">
        <Header />
        <main className="fixed top-[41.5px] w-full h-[calc(100vh-41.5px)] p-1">
          <ScrollArea className="h-full rounded-md border bg-accent/50 p-4 flex flex-col items-center justify-center w-full relative">
            {/* {JSON.stringify(note)} */}
            <NoteEditor noteId={noteId} />
            <div className="flex gap-2 justify-center items-center">
                    <TranscriptRecorder
                      className="fixed bottom-6 -translate-x-1/2 left-1/2 z-10"
                      noteId={noteId}
                    />
                    {/* <NoteGenerator noteId={noteId}/> */}
                  </div>
          </ScrollArea>
        </main>
      </div>
    </AuthenticatedLayout>
  );
}
