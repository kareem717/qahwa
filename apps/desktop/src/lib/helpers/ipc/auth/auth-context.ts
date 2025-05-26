import { contextBridge, ipcRenderer } from "electron";

export function exposeAuthContext() {
  if (contextBridge && ipcRenderer) {
    contextBridge.exposeInMainWorld("electronAuth", {
      openSignInWindow: () => {
        ipcRenderer.send("open-sign-in-window");
      },
      handleAuthCallback: (callback: (url: string) => void) => {
        console.log("[Preload] Setting up clerk-auth-callback listener"); // Debug log 1
        const handler = (_event: unknown, url: string) => {
          console.log(
            "[Preload] Received clerk-auth-callback IPC with URL:",
            url,
          ); // Debug log 2
          callback(url);
        };
        ipcRenderer.on("clerk-auth-callback", handler);
        return () => {
          console.log("[Preload] Cleaning up clerk-auth-callback listener"); // Debug log 3
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
