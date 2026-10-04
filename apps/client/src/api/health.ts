import type { HealthStatus } from '@cinelndex/shared';

/** 健康检查不走 /api 前缀，所以单独用 fetch 而不是 httpClient。 */
export const healthApi = {
  async check(): Promise<HealthStatus> {
    const response = await fetch('/health', { headers: { Accept: 'application/json' } });
    // 依赖不可用时后端返回 503，但响应体仍然是合法的 HealthStatus，需要照常解析。
    if (!response.ok && response.status !== 503) {
      throw new Error(`健康检查失败（HTTP ${response.status}）`);
    }
    return (await response.json()) as HealthStatus;
  },
};
