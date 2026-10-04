import { ApiError, type ApiErrorBody, type ApiErrorCode } from '@cinelndex/shared';
import { apiUrl, appConfig } from '../config';

/**
 * 浏览器端 HTTP 客户端：统一处理超时、JSON 解析与错误归一化。
 *
 * 特点是「失败即抛错」：调用方拿到的一定是数据，错误一律是 ApiError，
 * 于是 hooks 里只需要 try/catch + 一个 error 状态，不用层层判断 res.ok。
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  /** 会自动 JSON.stringify 并带上 Content-Type。 */
  body?: unknown;
  /** URL 查询参数，值为 undefined / null 的键会被忽略。 */
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

/** 把对象转成查询串，跳过空值。 */
function buildQueryString(query: RequestOptions['query']): string {
  if (!query) return '';

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized.length > 0 ? `?${serialized}` : '';
}

/** 尝试把响应体读成 JSON；读不出来就返回 null，绝不因为解析失败而吞掉真正的错误。 */
async function readJson(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (text.length === 0) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/** 把后端返回的统一错误体转成 ApiError。 */
function toApiError(response: Response, payload: unknown): ApiError {
  const body = payload as Partial<ApiErrorBody> | null;
  const message = body?.error?.message ?? `请求失败（HTTP ${response.status}）`;
  const code: ApiErrorCode = body?.error?.code ?? 'INTERNAL_ERROR';
  return new ApiError(response.status, code, message, body?.error?.details ?? []);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal, timeoutMs } = options;

  // 把调用方的 signal 与超时信号合并，任一触发都会中止请求。
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs ?? appConfig.requestTimeoutMs);
  signal?.addEventListener('abort', () => controller.abort(), { once: true });

  try {
    const response = await fetch(`${apiUrl(path)}${buildQueryString(query)}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });

    const payload = await readJson(response);
    if (!response.ok) throw toApiError(response, payload);
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(499, 'BAD_REQUEST', signal?.aborted ? '请求已取消' : '请求超时');
    }
    throw new ApiError(
      0,
      'INTERNAL_ERROR',
      '无法连接后端服务，请确认 apps/server 已启动',
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const httpClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
