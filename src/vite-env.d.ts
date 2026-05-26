/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 构建时注入的管理员密码，勿提交到 Git */
  readonly VITE_ADMIN_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
