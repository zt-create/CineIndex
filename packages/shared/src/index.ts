/**
 * @cinelndex/shared
 *
 * 前后端共享的「单一事实来源」：
 * - 领域类型：Movie / MovieGenre / Paginated
 * - HTTP 契约：ApiErrorBody / API_PREFIX / 分页常量
 * - 工具函数：ApiError、分页归一化、格式化
 *
 * 注意：本包不依赖任何 Node 或 DOM API，因此可以同时被 server（Node）与 client（浏览器）导入。
 */

export * from './types/domain.js';
export * from './types/api.js';
export * from './utils/errors.js';
export * from './utils/format.js';
