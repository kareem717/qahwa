import "@qahwa/desktop/App";
import {
  init,
  browserTracingIntegration,
  replayIntegration,
} from "@sentry/electron/renderer";
// import { init as reactInit } from '@sentry/react'

init(
  {
    environment: import.meta.env.VITE_NODE_ENV,
    integrations: [browserTracingIntegration(), replayIntegration()],
    enabled: import.meta.env.VITE_NODE_ENV === "production",
    release: import.meta.env.VITE_VERSION,
  },
  // reactInit
);
