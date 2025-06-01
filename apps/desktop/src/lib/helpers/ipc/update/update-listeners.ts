import type { BrowserWindow } from "electron";
import { autoUpdater } from "electron";
import {
  UPDATE_AVAILABLE_CHANNEL,
  UPDATE_DOWNLOADED_CHANNEL,
  UPDATE_INSTALL_CHANNEL,
  UPDATE_ERROR_CHANNEL,
  UPDATE_CHECKING_CHANNEL,
  UPDATE_NOT_AVAILABLE_CHANNEL,
  UPDATE_CHECK_FOR_UPDATES_CHANNEL,
} from "./update-channels";
import * as Sentry from "@sentry/electron";
import { registerIpcHandlers } from "../ipc-utils";

export function addUpdateEventListeners(mainWindow: BrowserWindow) {
  registerIpcHandlers({
    [UPDATE_INSTALL_CHANNEL]: () => {
      autoUpdater.quitAndInstall();
    },
    [UPDATE_CHECK_FOR_UPDATES_CHANNEL]: () => {
      autoUpdater.checkForUpdates();
    },
  });

  // For autoUpdater events, remove existing listeners and register new ones
  const autoUpdaterEvents = [
    "checking-for-update",
    "update-available",
    "update-not-available",
    "error",
    "update-downloaded"
  ] as const;

  for (const event of autoUpdaterEvents) {
    autoUpdater.removeAllListeners(event);
  }

  // AutoUpdater event listeners
  autoUpdater.on("checking-for-update", () => {
    mainWindow.webContents.send(UPDATE_CHECKING_CHANNEL);
  });

  autoUpdater.on("update-available", () => {
    mainWindow.webContents.send(UPDATE_AVAILABLE_CHANNEL);
  });

  autoUpdater.on("update-not-available", () => {
    mainWindow.webContents.send(UPDATE_NOT_AVAILABLE_CHANNEL);
  });

  autoUpdater.on("error", (err) => {
    console.error("Update error:", err);
    Sentry.captureException(err, {
      level: "error",
      tags: {
        component: "auto-updater",
        function: "update-error",
      },
    });
    mainWindow.webContents.send(UPDATE_ERROR_CHANNEL, {
      message: err.message,
    });
  });

  autoUpdater.on(
    "update-downloaded",
    (event, releaseNotes, releaseName, releaseDate, updateURL) => {
      const message = process.platform === "win32" ? releaseNotes : releaseName; // according to docs

      mainWindow.webContents.send(UPDATE_DOWNLOADED_CHANNEL, {
        message,
        releaseDate,
      });
    },
  );
}
