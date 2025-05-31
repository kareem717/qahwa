import { type BrowserWindow, ipcMain } from "electron";
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

export function addUpdateEventListeners(mainWindow: BrowserWindow) {
  // Handle install update request from renderer
  ipcMain.handle(UPDATE_INSTALL_CHANNEL, () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.handle(UPDATE_CHECK_FOR_UPDATES_CHANNEL, () => {
    autoUpdater.checkForUpdates();
  });

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

  autoUpdater.on("update-downloaded", (event, releaseNotes, releaseName, releaseDate, updateURL) => {
    const message = process.platform === "win32" ? releaseNotes : releaseName; // according to docs

    mainWindow.webContents.send(UPDATE_DOWNLOADED_CHANNEL, {
      message,
      releaseDate,
    });
  });
} 