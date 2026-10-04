/**
 * 应用配置的唯一出口。组件里不要直接读 import.meta.env。
 */
import { API_PREFIX } from '@cinelndex/shared';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';

export const appConfig = {
  appName: 'Cinelndex',
  /**
   * 默认留空，走 Vite 开发代理（同源 /api/v1）。
   * 生产环境可用 VITE_API_BASE_URL=https://api.example.com 指向独立后端。
   */
  apiBaseUrl: rawBaseUrl.length > 0 ? rawBaseUrl.replace(/\/$/, '') : '',
  apiPrefix: API_PREFIX,
  requestTimeoutMs: 15_000,
} as const;

/** 拼出完整的请求前缀，例如 `/api/v1` 或 `https://api.example.com/api/v1`。 */
export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${appConfig.apiBaseUrl}${appConfig.apiPrefix}${normalized}`;
}
