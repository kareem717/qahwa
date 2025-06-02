import React from "react";
import { NoteRoute } from "../routes/routes";
import { Header } from "../components/header";
import { ScrollArea } from "@qahwa/ui/components/scroll-area";
import { AuthenticatedLayout } from "../layouts/authenticated-layout";
import { setNoteId } from "../hooks/use-note-id";
import { NotePageMenuButton } from "../components/note-page-menu";
import { NoteEditor } from "../components/note-editor";

export default function NotePage() {
  const search = NoteRoute.useSearch();
  if (search.id) {
    setNoteId(search.id);
  }

  return (
    <AuthenticatedLayout>
      <div className="relative h-screen ">
        <Header />
        <main className="fixed top-[41.5px] w-full h-[calc(100vh-41.5px)] p-1">
          <ScrollArea className="h-full rounded-md border bg-accent/50 p-4 flex flex-col items-center justify-center w-full relative">
            <NoteEditor />
            <NotePageMenuButton />
          </ScrollArea>
        </main>
      </div>
    </AuthenticatedLayout>
  );
}
