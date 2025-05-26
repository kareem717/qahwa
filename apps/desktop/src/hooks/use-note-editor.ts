import { Store } from "@tanstack/react-store";

export type NoteEditorMode = "user" | "generated";

export const noteEditorModeStore = new Store<{
  mode: NoteEditorMode;
}>({
  mode: "user",
});

export const setNoteEditorMode = (mode: NoteEditorMode) => {
  noteEditorModeStore.setState((state) => {
    return {
      ...state,
      mode,
    };
  });
};
