/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ARK_API_KEY: string
  readonly VITE_ARK_BASE_URL: string
  readonly VITE_ARK_MODEL: string
  readonly VITE_ARK_VIDEO_API_KEY: string
  readonly VITE_ARK_VIDEO_BASE_URL: string
  readonly VITE_ARK_VIDEO_MODEL: string
  readonly VITE_TENCENT_SECRET_ID: string
  readonly VITE_TENCENT_SECRET_KEY: string
  readonly VITE_TENCENT_REGION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}



