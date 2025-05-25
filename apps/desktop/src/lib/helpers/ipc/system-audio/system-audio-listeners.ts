import {
  createAudioManager,
  type DeviceType,
  type PermissionResult,
} from "@note/osx-audio";
import { ipcMain, type IpcMainEvent } from "electron";

export function addSystemAudioEventListeners() {
  const audioManager = createAudioManager();

  ipcMain.handle("get-permissions", async () => {
    try {
      return await audioManager.getPermissions();
    } catch (error) {
      console.error("Error getting permissions:", error);
      throw error; // Re-throw to be caught by the invoke call
    }
  });

  ipcMain.on("start-capture", async (event: IpcMainEvent) => {
    try {
      audioManager.startCapture((data: ArrayBuffer) => {
        event.sender.send("audio-data", data);
      });
    } catch (e) {
      const error = e as Error;
      console.error("Error starting capture:", error);
      // Optionally, send an error message back to the renderer
      event.sender.send("capture-error", error.message);
    }
  });

  ipcMain.on("stop-capture", () => {
    try {
      console.log("Received stop-capture request from renderer.");
      audioManager.stopCapture();

      console.log("Audio capture stopped via IPC.");
    } catch (e) {
      const error = e as Error;
      console.error("Error stopping capture:", error);
      // Consider sending an error back to renderer if stopCapture can fail
      // event.sender.send('stop-capture-error', error.message);
    }
  });

  ipcMain.handle(
    "request-permissions",
    async (_event, deviceType: DeviceType): Promise<PermissionResult> => {
      try {
        console.log(
          `Received request-permissions for ${deviceType} from renderer.`,
        );
        const permissions = await audioManager.requestPermissions(deviceType);
        console.log(
          `Permissions after request for ${deviceType}:`,
          permissions,
        );
        return permissions;
      } catch (e) {
        const error = e as Error;
        console.error(`Error requesting permissions for ${deviceType}:`, error);
        throw error; // Re-throw to be caught by the invoke call in renderer
      }
    },
  );
}
