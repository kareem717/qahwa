import {
  createAudioManager,
  type DeviceType,
  type PermissionResult,
} from "@qahwa/osx-audio";
import type { IpcMainEvent } from "electron";
import { registerIpcHandlers, registerIpcListeners } from "../ipc-utils";

export function addSystemAudioEventListeners() {
  const audioManager = createAudioManager();

  registerIpcHandlers({
    "get-permissions": async () => {
      try {
        return await audioManager.getPermissions();
      } catch (error) {
        console.error("Error getting permissions:", error);
        throw error; // Re-throw to be caught by the invoke call
      }
    },
    "request-permissions": async (
      _event,
      ...args
    ): Promise<PermissionResult> => {
      try {
        const deviceType = args[0] as DeviceType;
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
        console.error(
          `Error requesting permissions for ${args[0] as DeviceType}:`,
          error,
        );
        throw error; // Re-throw to be caught by the invoke call in renderer
      }
    },
  });

  registerIpcListeners({
    "start-capture": async (event: IpcMainEvent) => {
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
    },
    "stop-capture": () => {
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
    },
  });
}
