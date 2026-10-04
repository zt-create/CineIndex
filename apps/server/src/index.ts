import type { Server } from 'node:http';
import { API_PREFIX } from '@cinelndex/shared';
import { createApp } from './app.js';
import { assertConfig, config } from './config/env.js';
import { logger } from './config/logger.js';
import { closePool, pingDatabase } from './db/pool.js';

/**
 * 进程入口：启动前先自检配置、探一次数据库，然后才开始监听。
 * 数据库暂时连不上不会阻止启动（日志里会明确写出来），
 * 这样本地开发可以先起服务再 `db:up`。
 */
async function bootstrap(): Promise<void> {
  assertConfig();

  try {
    const latency = await pingDatabase();
    logger.info(`PostgreSQL 连接正常（${latency}ms）`);
  } catch (error) {
    logger.warn('PostgreSQL 暂时不可用，服务仍会启动；请检查 docker compose 与 DATABASE_URL', error);
  }

  const app = createApp();
  const server: Server = app.listen(config.port, () => {
    logger.info(
      `${config.serviceName} 已启动 → http://localhost:${config.port} (${config.nodeEnv})`,
    );
    logger.info(`健康检查：http://localhost:${config.port}/health`);
    logger.info(`API 前缀：${API_PREFIX}`);
  });

  registerShutdownHooks(server);
}

function registerShutdownHooks(server: Server): void {
  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`收到 ${signal}，开始优雅退出`);

    // 10 秒还没关完就强制退出，避免容器停不下来。
    const forceExit = setTimeout(() => {
      logger.error('优雅退出超时，强制结束进程');
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    server.close(async (error) => {
      if (error) logger.error('关闭 HTTP 服务时出错', error);
      try {
        await closePool();
        logger.info('数据库连接池已关闭');
      } catch (poolError) {
        logger.error('关闭数据库连接池时出错', poolError);
      }
      process.exit(error ? 1 : 0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error('未处理的 Promise 拒绝', reason);
  });
  process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常，进程即将退出', error);
    process.exit(1);
  });
}

bootstrap().catch((error: unknown) => {
  logger.error('服务启动失败', error);
  process.exit(1);
});
