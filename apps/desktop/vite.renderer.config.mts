import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  define: {
    // Expose environment variables to renderer process
    __VITE_API_URL__: JSON.stringify(process.env.VITE_API_URL),
    __VITE_SIGN_IN_URL__: JSON.stringify(process.env.VITE_SIGN_IN_URL),
  },
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    sentryVitePlugin({
      org: "qahwa",
      project: "desktop"
    }),
    nodePolyfills({
      // You might need to fine-tune this based on specific needs
      protocolImports: true, // Needed for 'node:' protocol imports
      globals: {
        Buffer: true, // Provide Buffer polyfill
        process: true, // Provide process polyfill
      },
    }),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@note/desktop": path.resolve(__dirname, "./src"),
      "@note/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
});
