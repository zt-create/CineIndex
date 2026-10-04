import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger.js';

/** 给每个请求打上 id，便于把一次请求的多条日志串起来。 */
export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id');
  req.requestId = incoming && incoming.length <= 128 ? incoming : randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
}

/** 请求结束时记录一行访问日志（含耗时与状态码）。 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const line = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };

    if (res.statusCode >= 500) {
      // 探针在依赖不可用时会返回 503，这是「已知降级」而不是异常，用 warn 记就够了。
      const isProbe = req.path === '/health';
      if (isProbe) {
        logger.warn('健康检查未通过', line);
      } else {
        logger.error('请求处理失败', line);
      }
    } else if (res.statusCode >= 400) {
      logger.warn('请求被拒绝', line);
    } else {
      logger.info('请求完成', line);
    }
  });

  next();
}
