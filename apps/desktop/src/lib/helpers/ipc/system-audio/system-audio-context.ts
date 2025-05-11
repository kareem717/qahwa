import { contextBridge, ipcRenderer } from 'electron';
import type { DeviceType, PermissionResult } from '@note/osx-audio'; // Ensure types are available

export function exposeSystemAudioContext() {
  if (contextBridge && ipcRenderer) {
    contextBridge.exposeInMainWorld('electronSystemAudio', {
      getPermissions: (): Promise<PermissionResult> => {
        return ipcRenderer.invoke('get-permissions');
      },
      startCapture: (callback: (data: ArrayBuffer) => void): (() => void) => {
        // Send a message to the main process to start capture
        ipcRenderer.send('start-capture');

        // Listener for incoming audio data
        const audioDataListener = (_event: Electron.IpcRendererEvent, data: ArrayBuffer) => {
          callback(data);
        };
        ipcRenderer.on('audio-data', audioDataListener);

        // Listener for capture errors
        const captureErrorListener = (_event: Electron.IpcRendererEvent, errorMessage: string) => {
          console.error('Audio capture error:', errorMessage);
          // Optionally, you could have a separate error callback or re-throw
        };
        ipcRenderer.on('capture-error', captureErrorListener);

        // Return a cleanup function to remove listeners
        return () => {
          ipcRenderer.removeListener('audio-data', audioDataListener);
          ipcRenderer.removeListener('capture-error', captureErrorListener);
        };
      },
      stopCapture: (): void => {
        ipcRenderer.send('stop-capture');
      },
      requestPermissions: (deviceType: DeviceType): Promise<PermissionResult> => {
        return ipcRenderer.invoke('request-permissions', deviceType);
      },
    });
  } else {
    console.error('Failed to expose auth context: contextBridge or ipcRenderer not available.');
  }
}