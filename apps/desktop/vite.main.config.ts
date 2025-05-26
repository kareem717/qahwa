import { defineConfig } from "vite";
import path from "node:path";
import { builtinModules } from "node:module";

// https://vitejs.dev/config
export default defineConfig({
  define: {
    // Expose environment variables to main process
    __R2_BUCKET_NAME__: JSON.stringify(process.env.R2_BUCKET_NAME || ""),
    __R2_ENDPOINT__: JSON.stringify(process.env.R2_ENDPOINT || ""),
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
