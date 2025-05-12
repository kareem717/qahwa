import React, { useEffect, useState } from "react";
import { useNote } from "../hooks/use-note";
import { Note } from "@note/db/types";
import { NoteRoute } from "../routes/routes";

export default function NotePage() {
  const { id } = NoteRoute.useSearch()
  console.log(id)
  const { data, isLoading } = useNote({
    noteId: id || 0,
    enabled: id !== undefined,
  })


  return (
    <div className="flex h-full flex-col items-center justify-center">
      {isLoading ? (
        <div>Loading notes...</div>
      ) : data ? (
        <>
          NOTE PAGE:
          <div className="flex flex-col gap-4">
            {JSON.stringify(data)}
          </div>
        </>
      ) : (
        <div>
          New Note
        </div>
      )}
    </div>
  );
}
