import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@qahwa/desktop": path.resolve(__dirname, "./src"),
      "@qahwa/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
  test: {
    dir: "./src/tests/unit",
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/tests/unit/setup.ts",
    css: true,
    reporters: ["verbose"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*"],
      exclude: [],
    },
  },
});
