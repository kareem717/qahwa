import { contextBridge, ipcRenderer } from "electron";

export function exposeAuthContext() {
  if (contextBridge && ipcRenderer) {
    contextBridge.exposeInMainWorld("electronAuth", {
      openSignInWindow: () => {
        ipcRenderer.send("open-sign-in-window");
      },
      handleAuthCallback: (callback: (url: string) => Promise<void> | void) => {
        const handler = (_event: unknown, url: string) => {
          callback(url);
        };
        ipcRenderer.on("clerk-auth-callback", handler);
        return () => {
          ipcRenderer.removeListener("clerk-auth-callback", handler);
        };
      },
      getToken: async () => {
        try {
          return await ipcRenderer.invoke("jwt-get-token");
        } catch (error) {
          console.error("IPC Error getting token:", error);
          throw error;
        }
      },
      setToken: async (token: string) => {
        try {
          await ipcRenderer.invoke("jwt-set-token", token);
        } catch (error) {
          console.error("IPC Error setting token:", error);
          throw error;
        }
      },
      removeToken: async () => {
        try {
          await ipcRenderer.invoke("jwt-remove-token");
        } catch (error) {
          console.error("IPC Error removing token:", error);
          throw error;
        }
      },
    });
  } else {
    console.error(
      "Failed to expose auth context: contextBridge or ipcRenderer not available.",
    );
  }
}
