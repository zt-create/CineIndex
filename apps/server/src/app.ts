import cors, { type CorsOptions } from 'cors';
import express, { type Express } from 'express';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestContext, requestLogger } from './middleware/requestLogger.js';
import { API_BASE_PATH, apiRouter } from './routes/index.js';
import { healthRouter } from './routes/health.routes.js';

/** 根据白名单决定是否放行该来源；白名单里的 `*` 表示允许全部。 */
function buildCorsOptions(): CorsOptions {
  const allowed = config.cors.origins;

  return {
    origin(origin, callback) {
      // 同源请求 / curl 这类没有 Origin 头的请求直接放行。
      if (!origin) return callback(null, true);
      if (allowed.includes('*') || allowed.includes(origin)) return callback(null, true);
      return callback(new Error(`来源 ${origin} 不在 CORS 白名单内`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
    maxAge: 86_400,
  };
}

/**
 * 组装 Express 应用。
 *
 * 拆成工厂函数而不是在 index.ts 里直接写，是为了让测试可以
 * `createApp()` 拿到一个不监听端口的实例，配合 supertest 直接打请求。
 */
export function createApp(): Express {
  const app = express();

  // 不暴露技术栈信息。
  app.disable('x-powered-by');
  // 部署在反向代理后面时，才能拿到真实客户端 IP。
  app.set('trust proxy', 1);

  app.use(requestContext);
  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.use(healthRouter);
  app.use(API_BASE_PATH, apiRouter);

  // 顺序很重要：先 404，再错误处理。
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
