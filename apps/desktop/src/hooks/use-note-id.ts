import { Store } from "@tanstack/react-store";

export const DEFAULT_NOTE_ID = -999

export const noteIdStore = new Store({
  noteId: DEFAULT_NOTE_ID,
});

export const setNoteId = (noteId: number) => {
  noteIdStore.setState((state) => {
    return {
      ...state,
      noteId: noteId,
    };
  });

};