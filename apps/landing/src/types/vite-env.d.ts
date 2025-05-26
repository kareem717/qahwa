/// <reference types="vite/client" />

declare module "*.css?url" {
  const url: string;
  export default url;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_DESKTOP_PROTOCOL: string;
  readonly VITE_APP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
