import type { HealthStatus } from '@cinelndex/shared';
import { config } from '../config/env.js';
import { pingDatabase } from '../db/pool.js';

/** 健康检查：真的去打一次数据库，而不是只回一个 200。 */
export async function getHealthStatus(): Promise<HealthStatus> {
  let connected = false;
  let latencyMs: number | null = null;
  let error: string | undefined;

  try {
    latencyMs = await pingDatabase();
    connected = true;
  } catch (cause) {
    error = cause instanceof Error ? cause.message : '数据库连接失败';
  }

  return {
    status: connected ? 'ok' : 'degraded',
    service: config.serviceName,
    version: config.serviceVersion,
    uptimeSeconds: Number(process.uptime().toFixed(1)),
    database: {
      connected,
      latencyMs,
      ...(error === undefined ? {} : { error }),
    },
    timestamp: new Date().toISOString(),
  };
}
