import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError, type ApiErrorBody } from '@cinelndex/shared';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

/** 未匹配到任何路由时的 404。 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`找不到路由 ${req.method} ${req.originalUrl}`));
}

/** 判断 PostgreSQL 的唯一约束冲突（23505）。 */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}

/** body-parser 解析失败时抛出的错误（Express 5 不再附带 `body` 属性，因此按 type/status 判断）。 */
function isBodyParserError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  if (!(error instanceof SyntaxError)) return false;

  const candidate = error as { type?: unknown; status?: unknown; statusCode?: unknown };
  // entity.parse.failed = JSON 语法错误；entity.too.large = 超过 limit；
  // charset.unsupported = 不认识的编码。
  if (typeof candidate.type === 'string' && candidate.type.startsWith('entity.')) return true;
  return candidate.status === 400 || candidate.statusCode === 400;
}

/**
 * 全局错误中间件 —— 所有错误（含被 asyncHandler 转发进来的异步错误）最终都汇聚到这里。
 * Express 靠「4 个参数」识别错误中间件，`next` 不能省略。
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const resolved = normalize(error, req);

  if (resolved.status >= 500) {
    logger.error(`${resolved.code}: ${resolved.message}`, error);
  } else {
    logger.warn(`${resolved.code}: ${resolved.message}`, {
      requestId: req.requestId,
      path: req.originalUrl,
    });
  }

  const body: ApiErrorBody = resolved.toBody();
  res.status(resolved.status).json(body);
}

function normalize(error: unknown, req: Request): ApiError {
  if (error instanceof ApiError) return error;

  // zod 校验失败：转成 422 + 字段级错误。
  if (error instanceof ZodError) {
    return ApiError.validation(
      '请求数据校验未通过',
      error.issues.map((issue) => ({
        field: issue.path.join('.') || '(root)',
        message: issue.message,
      })),
    );
  }

  // express.json() 解析失败（非法 JSON、超出体积限制、编码不支持）。
  if (isBodyParserError(error)) {
    return ApiError.badRequest('请求体不是合法的 JSON');
  }

  if (isUniqueViolation(error)) {
    return ApiError.conflict('已存在相同的记录');
  }

  if (error instanceof Error) {
    // 生产环境不泄露内部错误信息，但保留 requestId 方便对日志。
    return config.isProduction
      ? new ApiError(500, 'INTERNAL_ERROR', `服务器内部错误（requestId: ${req.requestId}）`)
      : ApiError.internal(error.message);
  }

  return ApiError.internal('未知错误');
}
