/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_APP_PORT: string
  readonly VITE_API_URL: string
  readonly VITE_KEY_STORAGE_ACCOUNT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
