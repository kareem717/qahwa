import React from "react";
import { Store, useStore } from "@tanstack/react-store";
import { toast } from "sonner";
import type { UpdateInfo } from "../lib/helpers/ipc/update/update-context";

interface AppUpdaterState {
  isUpdateAvailable: boolean;
  isUpdateDownloaded: boolean;
  updateInfo: UpdateInfo | null;
  isInstalling: boolean;
}

const DEFAULT_APP_UPDATER_STATE: AppUpdaterState = {
  isUpdateAvailable: false,
  isUpdateDownloaded: false,
  updateInfo: null,
  isInstalling: false,
};

export const appUpdaterStore = new Store(DEFAULT_APP_UPDATER_STATE);

export const setIsUpdateAvailable = (isUpdateAvailable: boolean) => {
  appUpdaterStore.setState((state) => ({
    ...state,
    isUpdateAvailable,
  }));
};

export const setIsUpdateDownloaded = (isUpdateDownloaded: boolean) => {
  appUpdaterStore.setState((state) => ({
    ...state,
    isUpdateDownloaded,
  }));
};

export const setUpdateInfo = (updateInfo: UpdateInfo | null) => {
  appUpdaterStore.setState((state) => ({
    ...state,
    updateInfo,
  }));
};

export const setIsInstalling = (isInstalling: boolean) => {
  appUpdaterStore.setState((state) => ({
    ...state,
    isInstalling,
  }));
};

export function useAppUpdater() {
  const state = useStore(appUpdaterStore);

  const checkForUpdates = async () => {
    if (!window.electronUpdater) {
      console.warn("Electron updater not available");
      return;
    }
    await window.electronUpdater.checkForUpdates();
  };

  React.useEffect(() => {
    if (!window.electronUpdater) {
      console.warn("Electron updater not available");
      return;
    }

    const installUpdate = async () => {
      console.log("Installing update");
      const currentState = appUpdaterStore.state; // avoid using stale state
      if (!currentState.isUpdateDownloaded) {
        console.log("Update not downloaded");
        return;
      };

      try {
        setIsInstalling(true);
        console.log("Installing update");
        await window.electronUpdater.installUpdate();
        console.log("Update installed");
      } catch (error) {
        console.error("Failed to install update:", error);
        toast.error("Failed to install update. Please try again.");
        setIsInstalling(false);
      }
    };

    // Set up event listeners
    const cleanupUpdateAvailable = window.electronUpdater.onUpdateAvailable(() => {
      console.log("Update available");
      setIsUpdateAvailable(true);

      toast.info("Downloading latest version in the background");
    });

    const cleanupUpdateDownloaded = window.electronUpdater.onUpdateDownloaded((info) => {
      console.log("Update downloaded:", info);
      setUpdateInfo(info);
      setIsUpdateDownloaded(true);
      setIsUpdateAvailable(false);

      // Show persistent toast with action buttons
      toast.success(
        "Update ready to install",
        {
          duration: Number.POSITIVE_INFINITY, // Keep it persistent
          action: {
            label: "Restart & Install",
            onClick: installUpdate,
          },
          cancel: {
            label: "Later",
            onClick: () => {
              toast.dismiss();
            },
          },
          description: info?.message,
        }
      );
    });

    const cleanupUpdateError = window.electronUpdater.onUpdateError((error) => {
      console.error("Update error:", error);
      toast.error("Update failed", {
        duration: 3000,
        description: error.message,
      });
      setIsUpdateAvailable(false);
      setIsUpdateDownloaded(false);
    });

    const cleanupUpdateChecking = window.electronUpdater.onUpdateChecking(() => console.log("Checking for updates..."));

    const cleanupUpdateNotAvailable = window.electronUpdater.onUpdateNotAvailable(() => {
      console.log("No update available");
    });

    // Cleanup function
    return () => {
      cleanupUpdateAvailable();
      cleanupUpdateDownloaded();
      cleanupUpdateError();
      cleanupUpdateChecking();
      cleanupUpdateNotAvailable();
    };
  }, []);

  return {
    ...state,
    installUpdate: async () => {
      console.log("Installing update");
      const currentState = appUpdaterStore.state; // avoid using stale state
      if (!currentState.isUpdateDownloaded) {
        console.log("Update not downloaded");
        return;
      };

      try {
        setIsInstalling(true);
        console.log("Installing update");
        await window.electronUpdater.installUpdate();
        console.log("Update installed");
      } catch (error) {
        console.error("Failed to install update:", error);
        toast.error("Failed to install update. Please try again.");
        setIsInstalling(false);
      }
    },
    checkForUpdates,
  };
} 