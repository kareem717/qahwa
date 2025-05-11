import React, { useState } from "react";
import { useNote } from "../hooks/use-note";
import { useParams } from "@tanstack/react-router";
import { Note } from "@note/db/types";

export default function NotePage() {
  const { id } = useParams({ from: "/note/$id", strict: true })

  // technically should note fail since it's electron
  const noteId = parseInt(id)

  // Should be better to get from state
  const { data, isLoading } = useNote(noteId)

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
        <div>No notes found</div>
      )}
    </div>
  );
}
