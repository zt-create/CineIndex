/**
 * 影片领域模型（前后端共用）。
 *
 * 设计说明：
 * - 这里描述的是「HTTP 传输后」的形状，因此 `createdAt` 是 ISO 字符串而不是 Date。
 *   `pg` 驱动默认会把 TIMESTAMPTZ 解析成 Date，因此服务端在返回前统一做一次映射。
 */

/** 影片类型枚举，与 PostgreSQL 中的 `movie_genre` 枚举保持一致。 */
export const MOVIE_GENRES = [
  'action',
  'comedy',
  'drama',
  'documentary',
  'horror',
  'romance',
  'sci-fi',
  'thriller',
  'animation',
] as const;

export type MovieGenre = (typeof MOVIE_GENRES)[number];

/** 一部影片的完整记录。 */
export interface Movie {
  id: string;
  title: string;
  originalTitle: string | null;
  releaseYear: number;
  genre: MovieGenre;
  director: string;
  /** 评分，0 ~ 10，保留一位小数。 */
  rating: number | null;
  /** 时长（分钟）。 */
  runtimeMinutes: number | null;
  synopsis: string | null;
  createdAt: string;
}

/** 创建影片时提交的字段。 */
export interface CreateMovieInput {
  title: string;
  originalTitle?: string | null;
  releaseYear: number;
  genre: MovieGenre;
  director: string;
  rating?: number | null;
  runtimeMinutes?: number | null;
  synopsis?: string | null;
}

/** 更新影片时提交的字段（部分字段即可）。 */
export type UpdateMovieInput = Partial<CreateMovieInput>;

/** 影片列表查询条件。 */
export interface MovieQuery {
  /** 标题 / 导演模糊搜索关键字。 */
  search?: string;
  genre?: MovieGenre;
  page?: number;
  pageSize?: number;
  sort?: MovieSortField;
  order?: SortOrder;
}

export type MovieSortField = 'title' | 'releaseYear' | 'rating' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

/** 统一的分页返回结构。 */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** 健康检查返回结构。 */
export interface HealthStatus {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  uptimeSeconds: number;
  database: {
    connected: boolean;
    /** 往返耗时（毫秒）。 */
    latencyMs: number | null;
    error?: string;
  };
  timestamp: string;
}
