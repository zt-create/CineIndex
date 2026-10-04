import type { Request, Response } from 'express';
import type { HealthStatus } from '@cinelndex/shared';
import { getHealthStatus } from '../services/health.service.js';

/** GET /health —— 给负载均衡 / docker healthcheck 用的探针。 */
export async function getHealth(_req: Request, res: Response<HealthStatus>): Promise<void> {
  const status = await getHealthStatus();
  // 依赖不可用时返回 503，这样编排系统能感知到并摘掉这个实例。
  res.status(status.database.connected ? 200 : 503).json(status);
}
