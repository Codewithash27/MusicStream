/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  /** Preferred API base, e.g. http://127.0.0.1:8000/api/v1 */
  readonly VITE_API_URL: string;
  /** @deprecated Use VITE_API_URL */
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
