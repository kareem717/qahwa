import { defineConfig } from "vite";
import path from "path";
import { builtinModules } from 'node:module';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    lib: {
      entry: "src/main.ts",
      formats: ["cjs"],
      fileName: () => "main.cjs",
    },
    rollupOptions: {
      external: [
        'electron',
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`),
      ],
    },
    commonjsOptions: {
      ignoreDynamicRequires: true,
    },
    minify: process.env.NODE_ENV === 'production',
    outDir: '.vite/build',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
});
