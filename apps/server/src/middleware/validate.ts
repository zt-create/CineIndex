import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { ApiError } from '@cinelndex/shared';

type Source = 'body' | 'query' | 'params';

/**
 * 用 zod schema 校验并「净化」请求数据。
 *
 * 校验通过后会把解析结果写回 `req[source]`，于是 controller 拿到的是
 * 已经带默认值、已经转型的强类型对象，而不是原始的 `any`。
 */
export function validate<T extends ZodTypeAny>(schema: T, source: Source = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || '(root)',
        message: issue.message,
      }));
      next(new ApiError(422, 'VALIDATION_ERROR', '请求数据校验未通过', details));
      return;
    }

    // query / params 在 Express 5 里是 getter，直接赋值会抛错，因此用 defineProperty。
    Object.defineProperty(req, source, {
      value: result.data as z.infer<T>,
      writable: true,
      configurable: true,
      enumerable: true,
    });

    next();
  };
}
