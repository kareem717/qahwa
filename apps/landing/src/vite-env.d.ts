/// <reference types="vite/client" />

declare module '*.css?url' {
  const url: string;
  export default url;
}

interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  // strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly DATABASE_URL: string
  readonly VITE_API_URL: string,
  readonly VITE_API_SECRET_KEY: string,
  readonly VITE_DESKTOP_PROTOCOL: string,
  readonly VITE_APP_URL: string,
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}