import type { BrowserWindow } from "electron";
import { addThemeEventListeners } from "./theme/theme-listeners";
import { addWindowEventListeners } from "./window/window-listeners";
import { addAuthEventListeners } from "./auth/auth-listeners";
import { addSystemAudioEventListeners } from "./system-audio/system-audio-listeners";
import { addAECAudioEventListeners } from "./aec-audio/aec-audio-listeners";
import { addUpdateEventListeners } from "./update/update-listeners";

export default function registerListeners(mainWindow: BrowserWindow) {
  addWindowEventListeners(mainWindow);
  addThemeEventListeners();
  addAuthEventListeners();
  addSystemAudioEventListeners();
  addAECAudioEventListeners();
  addUpdateEventListeners(mainWindow);
}
