import { getClient } from "../lib/api";
import { noteIdStore } from "./use-note-id";
import { useStore } from "@tanstack/react-store";
import { fullNoteCollection } from "../lib/collections/notes";
import React from "react";
import { useOptimisticMutation } from "@tanstack/react-db";

export function useNoteGenerator() {
  const noteId = useStore(noteIdStore, (state) => state.noteId);
  const noteCollection = fullNoteCollection(noteId);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const { mutate } = useOptimisticMutation({
    mutationFn: async () => {
      await noteCollection.invalidate();
    },
  });

  async function generate() {
    // Optional: Add validation for noteId if needed, e.g.,
    // if (noteId === DEFAULT_NOTE_ID) {
    //   console.error("Cannot generate notes: Note ID is not set or is invalid.");
    //   return;
    // }

    setIsGenerating(true);

    try {
      const api = await getClient();
      const response = await api.note[":id"].generate.$put({
        param: {
          id: noteId.toString(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const textStream = response.body.pipeThrough(new TextDecoderStream());
      const reader = textStream.getReader();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        mutate(() => {
          const note = noteCollection.state.get(noteId.toString());
          if (!note) {
            throw new Error("Note not found");
          }

          noteCollection.update(note, (draft) => {
            draft.generatedNotes = draft.generatedNotes
              ? draft.generatedNotes + value
              : value;
          });
        });
      }
    } catch (error) {
      console.error("Error generating or streaming note:", error);
      // Optionally, set an error state in the store here
    } finally {
      setIsGenerating(false); // Use store action
    }
  }

  return {
    noteId,
    isGenerating,
    generate,
    canGenerate: true, // This could also be derived from store state if needed
  };
}
