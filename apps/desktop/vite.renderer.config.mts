import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({

  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
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
