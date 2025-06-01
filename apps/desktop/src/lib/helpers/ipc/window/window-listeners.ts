import type { BrowserWindow } from "electron";
import {
  WIN_CLOSE_CHANNEL,
  WIN_MAXIMIZE_CHANNEL,
  WIN_MINIMIZE_CHANNEL,
} from "./window-channels";
import { registerIpcHandlers } from "../ipc-utils";

export function addWindowEventListeners(mainWindow: BrowserWindow) {
  registerIpcHandlers({
    [WIN_MINIMIZE_CHANNEL]: () => {
      mainWindow.minimize();
    },
    [WIN_MAXIMIZE_CHANNEL]: () => {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    },
    [WIN_CLOSE_CHANNEL]: () => {
      mainWindow.close();
    },
  });
}
