import { getClient } from "../lib/api";
import { noteIdStore } from "./use-note-id";
import { useStore } from "@tanstack/react-store";
import { Store } from "@tanstack/react-store";

// ---- Store definition moved here ----
const noteGeneratorStore = new Store({
  generatedNotes: "",
  isGenerating: false,
});

const setIsGenerating = (status: boolean) => {
  noteGeneratorStore.setState((state) => ({
    ...state,
    isGenerating: status,
  }));
};

const appendGeneratedNotes = (chunk: string) => {
  noteGeneratorStore.setState((state) => ({
    ...state,
    generatedNotes: state.generatedNotes + chunk,
  }));
};

const clearGeneratedNotes = () => {
  noteGeneratorStore.setState((state) => ({
    ...state,
    generatedNotes: "",
  }));
};
// ---- End of moved store definition ----

export function useNoteGenerator() {
  const noteId = useStore(noteIdStore, (state) => state.noteId);
  const generatedNotes = useStore(noteGeneratorStore, (state) => state.generatedNotes);
  const isGenerating = useStore(noteGeneratorStore, (state) => state.isGenerating);

  async function generate() {
    // Optional: Add validation for noteId if needed, e.g.,
    // if (noteId === DEFAULT_NOTE_ID) {
    //   console.error("Cannot generate notes: Note ID is not set or is invalid.");
    //   return;
    // }

    setIsGenerating(true);
    clearGeneratedNotes(); // Clear previous notes using store action

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
        appendGeneratedNotes(value); // Use store action to append chunk
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
    generatedNotes,
    isGenerating,
    generate,
    canGenerate: true, // This could also be derived from store state if needed
  };
}
