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
        process.env.NODE_ENV === "development" ? "@note/osx-audio" : "", // only load in development
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
      ],
    },
    commonjsOptions: {
      ignoreDynamicRequires: true,
    },
    minify: process.env.NODE_ENV === "production",
    outDir: ".vite/build",
  },
  resolve: {
    alias: {
      "@note/desktop": path.resolve(__dirname, "./src"),
      "@note/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
});
