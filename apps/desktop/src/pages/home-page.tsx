import React from "react";
import { useUserNotes } from "../hooks/use-note";
import { NoteButton, SimpleNote } from "../components/note-button";
import { useAuth } from "../hooks/use-auth";
import { Header } from "../components/header";
import { Badge } from "@note/ui/components/badge";
import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@note/ui/components/button";
import { cn } from "@note/ui/lib/utils";
import { UserButton } from "../components/auth/user-button";
import { ScrollArea } from "@note/ui/components/scroll-area";

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

// Helper function to format date
function formatDate(dateString: string | null) {
  if (!dateString) return "Unknown Date"; // Handle null dateString
  const date = new Date(dateString);


  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
};

// Helper function to group notes by date
function groupNotesByDate(notes: SimpleNote[]): Record<string, SimpleNote[]> {
  if (!notes || notes.length === 0) return {};
  return notes.reduce((acc: Record<string, SimpleNote[]>, note: SimpleNote) => {
    const dateKey = formatDate(note.updatedAt);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(note);
    return acc;
  }, {});
};

export default function HomePage() {
  const { data, isLoading } = useUserNotes();
  const { data: authData } = useAuth();
  const groupedNotes = groupNotesByDate(data || []);
  const dateKeys = Object.keys(groupedNotes);

  // TODO: this shouldn't be full screen but scroll-view in the base layout makes h-full not work
  return (
    <div className="h-screen relative">
      <Header
        leftTag={
          <Badge
            variant="outline"
            className="text-muted-foreground h-5 rounded-sm px-1 font-mono text-xs tracking-wide"
          >
            <span className="text-xs">BETA</span>
          </Badge>
        }
      >
        <div className="flex items-center gap-1">
          <Link
            to="/_authenticated/note"
            className={cn(
              buttonVariants({
                variant: "secondary",
                size: "sm",
              }),
              "h-7 text-xs font-normal",
            )}
          >
            New Note
          </Link>
          <UserButton />
        </div>
      </Header>
      <main className="fixed top-[41.5px] w-full h-[calc(100vh-41.5px)] p-1">
        <ScrollArea className="h-full rounded-md border">
          <div className="h-40 flex items-center">
            <div className="container mx-auto">
              <h1 className="text-2xl font-semibold">Welcome back, {authData?.user?.name?.split(" ")[0]}</h1>
            </div>
          </div>
          <div className="flex h-full flex-col items-center bg-accent/50 py-12 px-8">
            {isLoading ? (
              <div className="w-full text-center">Loading notes...</div>
            ) : data && data.length > 0 ?
              (dateKeys.map((dateKey) => (
                <div key={dateKey} className="flex flex-col gap-2 container mx-auto mb-8 last:mb-0">
                  <h2 className="text-xl font-semibold">
                    {dateKey}
                  </h2>
                  <div className="flex flex-col">
                    {groupedNotes[dateKey].map((note: SimpleNote) => (
                      <NoteButton key={note.id} note={note} />
                    ))}
                  </div>
                </div>
              )))
              : (
                <div className="w-full text-center">No notes found</div>
              )}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
