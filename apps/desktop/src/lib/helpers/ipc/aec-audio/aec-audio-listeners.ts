import {
  createAudioManagerAEC,
  getDefaultAECConfig,
  type AECConfig,
  type DeviceType,
  type PermissionResult,
} from "@qahwa/osx-audio";
import type { IpcMainEvent } from "electron";
import { registerIpcHandlers, registerIpcListeners } from "../ipc-utils";

export function addAECAudioEventListeners() {
  const aecAudioManager = createAudioManagerAEC();

  registerIpcHandlers({
    "aec-get-permissions": async () => {
      try {
        return await aecAudioManager.getPermissions();
      } catch (error) {
        console.error("Error getting AEC permissions:", error);
        throw error;
      }
    },
    "aec-request-permissions": async (
      _event,
      ...args
    ): Promise<PermissionResult> => {
      try {
        const deviceType = args[0] as DeviceType;
        console.log(
          `Received AEC request-permissions for ${deviceType} from renderer.`,
        );
        const permissions = await aecAudioManager.requestPermissions(deviceType);
        console.log(
          `AEC permissions after request for ${deviceType}:`,
          permissions,
        );
        return permissions;
      } catch (e) {
        const error = e as Error;
        console.error(
          `Error requesting AEC permissions for ${args[0] as DeviceType}:`,
          error,
        );
        throw error;
      }
    },
    "aec-get-config": async () => {
      try {
        return aecAudioManager.getCurrentAECConfig();
      } catch (error) {
        console.error("Error getting AEC config:", error);
        throw error;
      }
    },
    "aec-update-config": async (_event, ...args): Promise<void> => {
      try {
        const config = args[0] as AECConfig;
        console.log("Updating AEC config:", config);
        aecAudioManager.updateAECConfig(config);
      } catch (e) {
        const error = e as Error;
        console.error("Error updating AEC config:", error);
        throw error;
      }
    },
    "aec-get-default-config": async () => {
      try {
        return getDefaultAECConfig();
      } catch (error) {
        console.error("Error getting default AEC config:", error);
        throw error;
      }
    },
    "aec-is-active": async () => {
      try {
        return aecAudioManager.isAECActive();
      } catch (error) {
        console.error("Error checking AEC active status:", error);
        throw error;
      }
    },
  });

  registerIpcListeners({
    "aec-start-capture": async (event: IpcMainEvent) => {
      try {
        aecAudioManager.startAECCapture((cleanAudio: ArrayBuffer, originalAudio: ArrayBuffer, systemAudio: ArrayBuffer) => {
          event.sender.send("aec-audio-data", {
            cleanAudio,
            originalAudio,
            systemAudio,
          });
        });
        console.log("AEC capture started via IPC.");
      } catch (e) {
        const error = e as Error;
        console.error("Error starting AEC capture:", error);
        event.sender.send("aec-capture-error", error.message);
      }
    },
    "aec-stop-capture": (event: IpcMainEvent) => {
      try {
        console.log("Received AEC stop-capture request from renderer.");
        aecAudioManager.stopAECCapture();
        console.log("AEC capture stopped via IPC.");
        event.sender.send("aec-capture-stopped");
      } catch (e) {
        const error = e as Error;
        console.error("Error stopping AEC capture:", error);
        event.sender.send("aec-stop-capture-error", error.message);
      }
    },
  });
} 