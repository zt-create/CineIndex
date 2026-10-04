/**
 * HTTP 层契约：错误响应体与字段级校验错误。
 */

/** 单个字段的校验失败信息。 */
export interface FieldError {
  field: string;
  message: string;
}

/** 所有非 2xx 响应统一的 JSON 结构。 */
export interface ApiErrorBody {
  error: {
    /** 机器可读的错误码，例如 NOT_FOUND / VALIDATION_ERROR。 */
    code: ApiErrorCode;
    message: string;
    details?: FieldError[];
  };
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BAD_REQUEST'
  | 'INTERNAL_ERROR';

/** API 根路径，客户端与服务端共享，避免两边写死后不一致。 */
export const API_PREFIX = '/api/v1';

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 100;
