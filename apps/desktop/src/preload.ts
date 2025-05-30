import exposeContexts from "./lib/helpers/ipc/context-exposer";
import "@sentry/electron/preload";

exposeContexts();
