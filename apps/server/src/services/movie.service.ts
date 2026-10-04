import type { PoolClient } from 'pg';
import { ApiError } from '@cinelndex/shared';
import type {
  Movie,
  MovieGenre,
  MovieSortField,
  Paginated,
  SortOrder,
} from '@cinelndex/shared';
import { query } from '../db/pool.js';

/** movies 表一行的原始形状（snake_case，numeric 会被 pg 返回成字符串）。 */
interface MovieRow {
  id: string;
  title: string;
  original_title: string | null;
  release_year: number;
  genre: MovieGenre;
  director: string;
  rating: string | number | null;
  runtime_minutes: number | null;
  synopsis: string | null;
  created_at: Date | string;
}

const SELECT_COLUMNS = `
  id, title, original_title, release_year, genre, director,
  rating, runtime_minutes, synopsis, created_at
`;

const SORTABLE_COLUMNS: Record<MovieSortField, string> = {
  title: 'title',
  releaseYear: 'release_year',
  rating: 'rating',
  createdAt: 'created_at',
};

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/** 数据库行 → 领域模型。所有字段出口都在这里统一，避免 numeric / Date 类型泄漏到 API。 */
function mapRow(row: MovieRow): Movie {
  return {
    id: row.id,
    title: row.title,
    originalTitle: row.original_title,
    releaseYear: row.release_year,
    genre: row.genre,
    director: row.director,
    rating: row.rating === null ? null : Number(row.rating),
    runtimeMinutes: row.runtime_minutes,
    synopsis: row.synopsis,
    createdAt: toIsoString(row.created_at),
  };
}

export interface ListMoviesParams {
  search?: string | undefined;
  genre?: MovieGenre | undefined;
  page: number;
  pageSize: number;
  sort: MovieSortField;
  order: SortOrder;
}

export interface UpdateMovieData {
  title?: string;
  originalTitle?: string | null;
  releaseYear?: number;
  genre?: MovieGenre;
  director?: string;
  rating?: number | null;
  runtimeMinutes?: number | null;
  synopsis?: string | null;
}

export interface CreateMovieData {
  title: string;
  originalTitle?: string | null;
  releaseYear: number;
  genre: MovieGenre;
  director: string;
  rating?: number | null;
  runtimeMinutes?: number | null;
  synopsis?: string | null;
}

/** 业务逻辑层：只认领域概念，不接触 req / res。 */
export const movieService = {
  /** 分页 + 关键字 + 类型筛选的列表查询，单次往返同时取回总数。 */
  async list(params: ListMoviesParams): Promise<Paginated<Movie>> {
    const { search, genre, page, pageSize, sort, order } = params;
    const where: string[] = [];
    const values: unknown[] = [];

    if (search) {
      values.push(`%${search.replace(/[%_\\]/g, (char) => `\\${char}`)}%`);
      const index = values.length;
      where.push(`(title ILIKE $${index} ESCAPE '\\' OR director ILIKE $${index} ESCAPE '\\')`);
    }

    if (genre) {
      values.push(genre);
      where.push(`genre = $${values.length}`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    // 白名单映射，杜绝把用户输入直接当列名拼进 SQL。
    const sortColumn = SORTABLE_COLUMNS[sort] ?? SORTABLE_COLUMNS.createdAt;
    const direction = order === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;

    values.push(pageSize, offset);
    const limitIndex = values.length - 1;
    const offsetIndex = values.length;

    const { rows } = await query<MovieRow & { total: string }>(
      `SELECT ${SELECT_COLUMNS}, COUNT(*) OVER() AS total
         FROM movies
         ${whereSql}
        ORDER BY ${sortColumn} ${direction} NULLS LAST, id ${direction}
        LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      values,
    );

    const total = rows[0] ? Number(rows[0].total) : 0;

    return {
      items: rows.map(mapRow),
      page,
      pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    };
  },

  async getById(id: string): Promise<Movie> {
    const { rows } = await query<MovieRow>(
      `SELECT ${SELECT_COLUMNS} FROM movies WHERE id = $1`,
      [id],
    );

    const row = rows[0];
    if (!row) throw ApiError.notFound(`影片 ${id} 不存在`);
    return mapRow(row);
  },

  async create(data: CreateMovieData): Promise<Movie> {
    const { rows } = await query<MovieRow>(
      `INSERT INTO movies
         (title, original_title, release_year, genre, director, rating, runtime_minutes, synopsis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${SELECT_COLUMNS}`,
      [
        data.title,
        data.originalTitle ?? null,
        data.releaseYear,
        data.genre,
        data.director,
        data.rating ?? null,
        data.runtimeMinutes ?? null,
        data.synopsis ?? null,
      ],
    );

    const row = rows[0];
    if (!row) throw ApiError.internal('插入影片后未返回记录');
    return mapRow(row);
  },

  /**
   * 更新影片。
   * - `partial: false`（PUT）：未提供的可空字段会被清空，语义是「整体替换」。
   * - `partial: true`（PATCH）：只更新显式提供的字段。
   */
  async update(id: string, data: UpdateMovieData, partial = false): Promise<Movie> {
    const assignments: string[] = [];
    const values: unknown[] = [];

    const assign = (column: string, value: unknown): void => {
      values.push(value);
      assignments.push(`${column} = $${values.length}`);
    };

    // 非空字段：两种语义下都只在显式提供时才更新。
    if (data.title !== undefined) assign('title', data.title);
    if (data.releaseYear !== undefined) assign('release_year', data.releaseYear);
    if (data.genre !== undefined) assign('genre', data.genre);
    if (data.director !== undefined) assign('director', data.director);

    // 可空字段：PUT 时缺失即清空，PATCH 时缺失即保持不动。
    const nullableColumns: Array<[keyof UpdateMovieData, string]> = [
      ['originalTitle', 'original_title'],
      ['rating', 'rating'],
      ['runtimeMinutes', 'runtime_minutes'],
      ['synopsis', 'synopsis'],
    ];

    for (const [key, column] of nullableColumns) {
      const value = data[key];
      if (value !== undefined) {
        assign(column, value);
      } else if (!partial) {
        assign(column, null);
      }
    }

    if (assignments.length === 0) {
      // 没有任何字段可更新，直接返回当前状态（PATCH 空对象是合法请求）。
      return this.getById(id);
    }

    values.push(id);
    const { rows } = await query<MovieRow>(
      `UPDATE movies
          SET ${assignments.join(', ')}
        WHERE id = $${values.length}
        RETURNING ${SELECT_COLUMNS}`,
      values,
    );

    const row = rows[0];
    if (!row) throw ApiError.notFound(`影片 ${id} 不存在`);
    return mapRow(row);
  },

  async remove(id: string): Promise<void> {
    const { rowCount } = await query('DELETE FROM movies WHERE id = $1', [id]);
    if (rowCount === 0) throw ApiError.notFound(`影片 ${id} 不存在`);
  },

  /** 供其它 service 复用的原始行查询（例如事务内校验存在性）。 */
  async existsWithin(client: PoolClient, id: string): Promise<boolean> {
    const { rowCount } = await client.query('SELECT 1 FROM movies WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },
};

export type MovieService = typeof movieService;
