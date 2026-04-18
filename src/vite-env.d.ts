/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JOTFORM_API_KEYS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
