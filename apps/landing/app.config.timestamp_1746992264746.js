// app.config.ts
import { defineConfig } from "@tanstack/react-start/config";
import tsConfigPaths from "vite-tsconfig-paths";
import { cloudflare } from "unenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
var currentDir = path.dirname(fileURLToPath(import.meta.url));
var config = defineConfig({
  tsr: {
    appDirectory: "src"
  },
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"]
      })
    ],
    resolve: {
      alias: [
        { find: "@note/landing", replacement: path.resolve(currentDir, "./src") },
        { find: "@note/ui", replacement: path.resolve(currentDir, "../../packages/ui/src") }
      ]
    }
  },
  server: {
    preset: "cloudflare-pages",
    unenv: cloudflare
  }
});
var app_config_default = config;
export {
  app_config_default as default
};
