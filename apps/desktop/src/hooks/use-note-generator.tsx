import { useState } from "react"
import { getClient } from "../lib/api";

export function useNoteGenerator(noteId: number) {
  const [generatedNotes, setGeneratedNotes] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)

  async function generate() {
    // if (!note.id) {
    //   throw new Error("Note ID is required")
    // }

    // if (!note.transcript) {
    //   throw new Error("Note has no transcript")
    // }

    setIsGenerating(true);

    try {
      const stream = (await getClient()).note[":id"].generate.$put({
        param: {
          id: noteId.toString(),
        },
      });


      // @ts-ignore
      stream.body.pipeTo(new WritableStream({
        write(chunk) {
          setGeneratedNotes(chunk);
        },
        close() {
          setIsGenerating(false);
        },
      }));
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
    }
  };

  return {
    noteId,
    generatedNotes,
    isGenerating,
    generate,
    canGenerate: true,
  }
}
