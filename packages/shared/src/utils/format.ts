import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../types/api.js';
import type { MovieGenre } from '../types/domain.js';
import { MOVIE_GENRES } from '../types/domain.js';

/** 把任意输入收敛成合法的页码（从 1 开始）。 */
export function normalizePage(value: unknown, fallback = 1): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

/** 把任意输入收敛成合法的每页条数，并限制上限。 */
export function normalizePageSize(value: unknown, fallback = DEFAULT_PAGE_SIZE): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), MAX_PAGE_SIZE);
}

/** 类型守卫：判断字符串是否是合法的影片类型。 */
export function isMovieGenre(value: unknown): value is MovieGenre {
  return typeof value === 'string' && (MOVIE_GENRES as readonly string[]).includes(value);
}

/** 去掉字符串两端空白，空字符串归一为 null。 */
export function toNullableText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** 截断长文本，用于列表页摘要。 */
export function truncate(text: string, maxLength = 120): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

/** 把分钟格式化成 `2h 15m` 这样的展示文本。 */
export function formatRuntime(minutes: number | null): string {
  if (minutes === null || minutes <= 0) return '—';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}
