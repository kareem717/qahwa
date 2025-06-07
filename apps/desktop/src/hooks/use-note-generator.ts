import { getClient } from "../lib/api";
import { DEFAULT_NOTE_ID, noteIdStore } from "./use-note-id";
import { useStore } from "@tanstack/react-store";
import { fullNoteCollection } from "../lib/collections/notes";
import { useOptimisticMutation } from "@tanstack/react-db";
import { useState } from "react";
import { toast } from "sonner";
import { asyncDebounce } from "@tanstack/pacer";

export function useNoteGenerator() {
  const noteId = useStore(noteIdStore, (state) => state.noteId);
  const noteCollection = fullNoteCollection(noteId);
  const [isGenerating, setIsGenerating] = useState(false);

  const invalidate = asyncDebounce(
    async () => {
      await noteCollection.invalidate()
    },
    {
      wait: 1500, // wait for db to be updated
    },
  )



  const { mutate } = useOptimisticMutation({
    mutationFn: async () => {
      // TODO: remove when new sync engine is implemented
      await invalidate();
    },
  });

  async function generate() {
    if (noteId === DEFAULT_NOTE_ID) {
      toast.error("Cannot generate notes");
      return;
    }

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

      let isFirstChunk = true;
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const note = noteCollection.state.get(noteId.toString());
        if (!note) {
          throw new Error("Note not found");
        }

        mutate(() => {
          noteCollection.update(note, (draft) => {
            draft.generatedNotes = isFirstChunk // reset on first chunk
              ? value
              : note.generatedNotes
                ? note.generatedNotes + value
                : value;
          });
        });

        if (isFirstChunk) {
          isFirstChunk = false;
        }
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
