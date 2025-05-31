import { contextBridge, ipcRenderer } from "electron";
import {
  UPDATE_AVAILABLE_CHANNEL,
  UPDATE_DOWNLOADED_CHANNEL,
  UPDATE_INSTALL_CHANNEL,
  UPDATE_ERROR_CHANNEL,
  UPDATE_CHECKING_CHANNEL,
  UPDATE_NOT_AVAILABLE_CHANNEL,
  UPDATE_CHECK_FOR_UPDATES_CHANNEL,
} from "./update-channels";

export interface UpdateInfo {
  message?: string;
  releaseDate?: string;
}

export interface UpdateError {
  message: string;
}

export function exposeUpdateContext() {
  if (contextBridge && ipcRenderer) {
    contextBridge.exposeInMainWorld("electronUpdater", {
      // Request installation of downloaded update
      installUpdate: () => ipcRenderer.invoke(UPDATE_INSTALL_CHANNEL),

      checkForUpdates: () => ipcRenderer.invoke(UPDATE_CHECK_FOR_UPDATES_CHANNEL),

      // Listen for update events
      onUpdateAvailable: (callback: () => void) => {
        const handler = () => {
          callback();
        };
        
        ipcRenderer.on(UPDATE_AVAILABLE_CHANNEL, handler);
        return () => {
          ipcRenderer.removeListener(UPDATE_AVAILABLE_CHANNEL, handler);
        };
      },

      onUpdateDownloaded: (callback: (updateInfo: UpdateInfo) => void) => {
        const handler = (_event: unknown, updateInfo: UpdateInfo) => {
          callback(updateInfo);
        };
        ipcRenderer.on(UPDATE_DOWNLOADED_CHANNEL, handler);
        return () => {
          ipcRenderer.removeListener(UPDATE_DOWNLOADED_CHANNEL, handler);
        };
      },

      onUpdateError: (callback: (error: UpdateError) => void) => {
        const handler = (_event: unknown, error: UpdateError) => {
          callback(error);
        };
        ipcRenderer.on(UPDATE_ERROR_CHANNEL, handler);
        return () => {
          ipcRenderer.removeListener(UPDATE_ERROR_CHANNEL, handler);
        };
      },

      onUpdateChecking: (callback: () => void) => {
        const handler = () => {
          callback();
        };
        ipcRenderer.on(UPDATE_CHECKING_CHANNEL, handler);
        return () => {
          ipcRenderer.removeListener(UPDATE_CHECKING_CHANNEL, handler);
        };
      },

      onUpdateNotAvailable: (callback: () => void) => {
        const handler = (_event: unknown) => {
          callback();
        };
        ipcRenderer.on(UPDATE_NOT_AVAILABLE_CHANNEL, handler);
        return () => {
          ipcRenderer.removeListener(UPDATE_NOT_AVAILABLE_CHANNEL, handler);
        };
      },
    });
  } else {
    console.error(
      "Failed to expose update context: contextBridge or ipcRenderer not available."
    );
  }
} 