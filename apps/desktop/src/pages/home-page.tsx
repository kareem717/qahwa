import React from "react";
import { useUserNotes } from "../hooks/use-note";

export default function HomePage() {
  const { data, isLoading } = useUserNotes()

  return (
    <div className="flex h-full flex-col items-center justify-center">
      {isLoading ? (
        <div>Loading notes...</div>
      ) : data && data.length > 0 ? (
        <>
          NOTES:
          <div className="flex flex-col gap-4">
            {data?.map((note) => (
              <div key={note.id}>
                <h1>{note.title}</h1>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div>No notes found</div>
      )}
    </div>
  );
}
