/// <reference types="vite/client" />

/** 项目自定义的环境变量，与 .env.example 对应。 */
interface ImportMetaEnv {
  /**
   * 后端地址。
   * - 留空（推荐）：走 vite.config.ts 里的代理，浏览器请求同源 `/api/...`
   * - 填写绝对地址：例如 http://localhost:4000，用于前后端分开部署
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
