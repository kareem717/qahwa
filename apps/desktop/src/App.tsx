import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { syncThemeWithLocal } from "./lib/helpers/theme_helpers";
import { useTranslation } from "react-i18next";
import "./lib/localization/i18n";
import { updateAppLanguage } from "./lib/helpers/language_helpers";
import { router } from "./routes/router";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "./components/providers/auth-provider";
import { getQueryClient } from "./lib/query-client";

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    syncThemeWithLocal();
    updateAppLanguage(i18n);

    const cleanup = window.electronAuth.handleAuthCallback(
      async (callbackUrl: string) => {
        try {
          const key = callbackUrl.split("key=")[1];
          if (!key) {
            throw new Error("No key found in callback URL");
          }

          window.electronAuth.setToken(key);
          window.location.reload();
        } catch (error) {
          console.error(
            "Error handling Clerk auth callback in renderer:",
            error,
          );
          if (error instanceof Error) {
            alert(`Error handling auth callback: ${error.message}`);
          } else {
            alert("An unknown error occurred during auth callback.");
          }
        }
      },
    );

    return cleanup;
  }, [i18n]);

  return (
    <QueryClientProvider client={getQueryClient()}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

const app = document.getElementById("app");
if (!app) {
  throw new Error("App element not found");
}

const root = createRoot(app);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
