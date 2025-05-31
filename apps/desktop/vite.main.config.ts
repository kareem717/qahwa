import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import path from "node:path";
import { builtinModules } from "node:module";

// https://vitejs.dev/config
export default defineConfig({
  define: {
    // Expose environment variables to main process
    __VITE_API_URL__: JSON.stringify(process.env.VITE_API_URL || ""),
    __VITE_SIGN_IN_URL__: JSON.stringify(process.env.VITE_SIGN_IN_URL || ""),
    __VITE_R2_BUCKET_NAME__: JSON.stringify(process.env.R2_BUCKET_NAME || ""),
    __VITE_R2_ENDPOINT__: JSON.stringify(process.env.R2_ENDPOINT || ""),
    __VITE_DESKTOP_PROTOCOL__: JSON.stringify(
      process.env.VITE_DESKTOP_PROTOCOL || "",
    ),
    __VITE_SENTRY_DSN__: JSON.stringify(process.env.SENTRY_DSN || ""),
    __VITE_NODE_ENV__: JSON.stringify(process.env.NODE_ENV || ""),
    __VITE_VERSION__: JSON.stringify(process.env.VERSION || ""),
  },

  build: {
    lib: {
      entry: "src/main.ts",
      formats: ["cjs"],
      fileName: () => "main.cjs",
    },

    rollupOptions: {
      external: [
        "electron",
        process.env.NODE_ENV === "development" ? "@note/osx-audio" : "", // needed for `pnpm start`
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
      ],
    },

    commonjsOptions: {
      ignoreDynamicRequires: true,
    },

    minify: process.env.NODE_ENV === "production",
    outDir: ".vite/build",
    sourcemap: true
  },

  resolve: {
    alias: {
      "@note/desktop": path.resolve(__dirname, "./src"),
      "@note/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },

  plugins: [
    sentryVitePlugin({
      org: "qahwa",
      project: "desktop",
      authToken: process.env.SENTRY_AUTH_TOKEN
    })
  ]
});