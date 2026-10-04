import type { ApiErrorBody, ApiErrorCode, FieldError } from '../types/api.js';

/**
 * 带 HTTP 状态码的 API 错误。
 *
 * 服务端在 service 层 `throw new ApiError(404, 'NOT_FOUND', '影片不存在')`，
 * 由错误中间件统一序列化；客户端在 fetch 封装里重新抛出同一种错误类型，
 * 于是 UI 层只需要判断 `instanceof ApiError` 就能区分业务错误与网络错误。
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: FieldError[];

  constructor(status: number, code: ApiErrorCode, message: string, details: FieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    // 让 `instanceof` 在编译到 ES5/ES2015 目标时仍然可靠。
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static notFound(message = '资源不存在'): ApiError {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static validation(message: string, details: FieldError[] = []): ApiError {
    return new ApiError(422, 'VALIDATION_ERROR', message, details);
  }

  static badRequest(message = '请求参数不合法'): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message);
  }

  static conflict(message = '资源冲突'): ApiError {
    return new ApiError(409, 'CONFLICT', message);
  }

  static internal(message = '服务器内部错误'): ApiError {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }

  /** 转换为统一的响应体。 */
  toBody(): ApiErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details.length > 0 ? { details: this.details } : {}),
      },
    };
  }
}
