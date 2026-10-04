/**
 * Extend the Express Request type so our own request-scoped fields are typed.
 *
 * 写成 .ts 而不是 .d.ts，是为了让 tsc 把它一起输出到 dist —— 否则构建产物里
 * 缺少这份类型增强，别人 import 编译后的服务时 `req.requestId` 会报错。
 * 文件本身没有任何运行时代码，`export {}` 让它保持为模块。
 */
declare global {
  namespace Express {
    interface Request {
      /** Set by the requestContext middleware, echoed in the x-request-id header. */
      requestId: string;
    }
  }
}

export {};
