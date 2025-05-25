// app.config.ts
import { defineConfig } from '@tanstack/react-start/config'
import tsConfigPaths from 'vite-tsconfig-paths'
import { cloudflare } from 'unenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const config = defineConfig({
  tsr: {
    appDirectory: 'src',
  },
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ['./tsconfig.json'],
      })
    ],
    resolve: {
      alias: [
        { find: '@note/landing', replacement: path.resolve(currentDir, './src') },
        { find: '@note/ui', replacement: path.resolve(currentDir, '../../packages/ui/src') },
      ]
    },
    define: {
      __VITE_APP_URL__: JSON.stringify(process.env.VITE_APP_URL),
      __VITE_API_URL__: JSON.stringify(process.env.VITE_API_URL),
      __VITE_DESKTOP_PROTOCOL__: JSON.stringify(process.env.VITE_DESKTOP_PROTOCOL),
    },
  },
  server: {
    preset: 'cloudflare-pages',
    unenv: cloudflare,
  },
})

export default config
