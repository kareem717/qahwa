import { ipcMain, type IpcMainInvokeEvent } from "electron";

/**
 * Utility to safely register IPC handlers by removing existing ones first
 */
export function registerIpcHandlers(handlers: Record<string, (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown>) {
  // Remove existing handlers first
  for (const channel of Object.keys(handlers)) {
    ipcMain.removeHandler(channel);
  }

  // Register new handlers
  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.handle(channel, handler);
  }
}

/**
 * Utility to safely register IPC listeners by removing existing ones first
 */
export function registerIpcListeners(listeners: Record<string, (event: Electron.IpcMainEvent, ...args: unknown[]) => void>) {
  // Remove existing listeners first
  for (const channel of Object.keys(listeners)) {
    ipcMain.removeAllListeners(channel);
  }

  // Register new listeners
  for (const [channel, listener] of Object.entries(listeners)) {
    ipcMain.on(channel, listener);
  }
}

/**
 * Utility to safely register event emitter listeners by removing existing ones first
 */
export function registerEventListeners<T extends { removeAllListeners: (event: string) => unknown, on: (event: string, listener: (...args: unknown[]) => void) => unknown }>(
  emitter: T,
  listeners: Record<string, (...args: unknown[]) => void>
) {
  // Remove existing listeners first
  for (const event of Object.keys(listeners)) {
    emitter.removeAllListeners(event);
  }

  // Register new listeners
  for (const [event, listener] of Object.entries(listeners)) {
    emitter.on(event, listener);
  }
} 