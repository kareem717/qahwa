import { contextBridge, ipcRenderer } from "electron";
import type { DeviceType, PermissionResult, AECConfig } from "@qahwa/osx-audio";

export interface AECAudioData {
  cleanAudio: ArrayBuffer;
  originalAudio: ArrayBuffer;
  systemAudio: ArrayBuffer;
}

export function exposeAECAudioContext() {
  if (contextBridge && ipcRenderer) {
    contextBridge.exposeInMainWorld("electronAECAudio", {
      getPermissions: (): Promise<PermissionResult> => {
        return ipcRenderer.invoke("aec-get-permissions");
      },
      requestPermissions: (deviceType: DeviceType): Promise<PermissionResult> => {
        return ipcRenderer.invoke("aec-request-permissions", deviceType);
      },
      getConfig: (): Promise<AECConfig> => {
        return ipcRenderer.invoke("aec-get-config");
      },
      updateConfig: (config: AECConfig): Promise<void> => {
        return ipcRenderer.invoke("aec-update-config", config);
      },
      getDefaultConfig: (): Promise<AECConfig> => {
        return ipcRenderer.invoke("aec-get-default-config");
      },
      isActive: (): Promise<boolean> => {
        return ipcRenderer.invoke("aec-is-active");
      },
      startCapture: (callback: (data: AECAudioData) => void): (() => void) => {
        // Send a message to the main process to start AEC capture
        ipcRenderer.send("aec-start-capture");

        // Listener for incoming AEC audio data
        const aecAudioDataListener = (
          _event: Electron.IpcRendererEvent,
          data: AECAudioData,
        ) => {
          callback(data);
        };
        ipcRenderer.on("aec-audio-data", aecAudioDataListener);

        // Listener for capture errors
        const captureErrorListener = (
          _event: Electron.IpcRendererEvent,
          errorMessage: string,
        ) => {
          console.error("AEC capture error:", errorMessage);
        };
        ipcRenderer.on("aec-capture-error", captureErrorListener);

        // Listener for capture stopped confirmation
        const captureStoppedListener = (
          _event: Electron.IpcRendererEvent,
        ) => {
          console.log("AEC capture stopped");
        };
        ipcRenderer.on("aec-capture-stopped", captureStoppedListener);

        // Listener for stop capture errors
        const stopCaptureErrorListener = (
          _event: Electron.IpcRendererEvent,
          errorMessage: string,
        ) => {
          console.error("AEC stop capture error:", errorMessage);
        };
        ipcRenderer.on("aec-stop-capture-error", stopCaptureErrorListener);

        // Return a cleanup function to remove listeners
        return () => {
          ipcRenderer.removeListener("aec-audio-data", aecAudioDataListener);
          ipcRenderer.removeListener("aec-capture-error", captureErrorListener);
          ipcRenderer.removeListener("aec-capture-stopped", captureStoppedListener);
          ipcRenderer.removeListener("aec-stop-capture-error", stopCaptureErrorListener);
        };
      },
      stopCapture: (): void => {
        ipcRenderer.send("aec-stop-capture");
      },
    });
  } else {
    console.error(
      "Failed to expose AEC audio context: contextBridge or ipcRenderer not available.",
    );
  }
} 