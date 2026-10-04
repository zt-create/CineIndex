import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * 把 async 处理函数包成符合 Express 签名的中间件。
 *
 * Express 5 已经会自动捕获被拒绝的 Promise，这里额外包一层是为了：
 * 1. 让返回类型显式收敛为 `Promise<void>`，避免 `no-misused-promises` 一类告警；
 * 2. 保留对 Express 4 的兼容余地。
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
}
