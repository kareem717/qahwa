import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { syncThemeWithLocal } from "./helpers/theme_helpers";
import { useTranslation } from "react-i18next";
import "./localization/i18n";
import { updateAppLanguage } from "./helpers/language_helpers";
import { router } from "./routes/router";
import { RouterProvider } from "@tanstack/react-router";

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    syncThemeWithLocal();
    updateAppLanguage(i18n);

    const cleanup = window.electronAuth.handleAuthCallback(async (callbackUrl: string) => {
      try {
        const jwt = callbackUrl.split('jwt=')[1]
        if (!jwt) {
          throw new Error("No JWT found in callback URL");
        }

        window.electronAuth.setToken(jwt)
        window.location.reload()
      } catch (error) {
        console.error("Error handling Clerk auth callback in renderer:", error);
        if (error instanceof Error) {
          alert(`Error handling auth callback: ${error.message}`);
        } else {
          alert(`An unknown error occurred during auth callback.`);
        }
      }
    });

    return cleanup;
  }, [i18n]);

  return <RouterProvider router={router} />;
}

const root = createRoot(document.getElementById("app")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);