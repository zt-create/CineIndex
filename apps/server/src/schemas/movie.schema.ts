import { z } from 'zod';
import { MOVIE_GENRES } from '@cinelndex/shared';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@cinelndex/shared';

/** 允许的排序字段，白名单化可以避免把列名直接拼进 SQL。 */
const SORT_FIELDS = ['title', 'releaseYear', 'rating', 'createdAt'] as const;

const currentYear = new Date().getFullYear();

const title = z.string().trim().min(1, '片名不能为空').max(200, '片名不能超过 200 个字符');
const director = z.string().trim().min(1, '导演不能为空').max(120, '导演名不能超过 120 个字符');
const nullableText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label}不能超过 ${max} 个字符`)
    .nullish()
    .transform((value) => (value === undefined || value === null || value === '' ? null : value));

export const createMovieSchema = z.object({
  title,
  originalTitle: nullableText(200, '原名'),
  releaseYear: z
    .number({ invalid_type_error: '上映年份必须是数字' })
    .int('上映年份必须是整数')
    .min(1888, '电影诞生于 1888 年之后')
    .max(currentYear + 5, `上映年份不能超过 ${currentYear + 5}`),
  genre: z.enum(MOVIE_GENRES, {
    errorMap: () => ({ message: `影片类型必须是以下之一：${MOVIE_GENRES.join(' / ')}` }),
  }),
  director,
  rating: z
    .number({ invalid_type_error: '评分必须是数字' })
    .min(0, '评分不能小于 0')
    .max(10, '评分不能大于 10')
    .nullish()
    .transform((value) => (value === undefined ? null : value)),
  runtimeMinutes: z
    .number({ invalid_type_error: '时长必须是数字' })
    .int('时长必须是整数分钟')
    .min(1, '时长必须大于 0')
    .max(1200, '时长看起来不太对')
    .nullish()
    .transform((value) => (value === undefined ? null : value)),
  synopsis: nullableText(4000, '剧情简介'),
});

/** PUT 语义为「整体替换」，因此复用创建 schema。 */
export const updateMovieSchema = createMovieSchema;

/** PATCH 语义为「局部更新」，所有字段可选。 */
export const patchMovieSchema = createMovieSchema.partial();

export const movieIdSchema = z.object({
  id: z.string().uuid('影片 id 必须是合法的 UUID'),
});

/** query 里的值都是字符串，这里负责转成数字并落地默认值。 */
export const listMoviesQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
  genre: z.enum(MOVIE_GENRES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  sort: z.enum(SORT_FIELDS).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateMovieRequest = z.infer<typeof createMovieSchema>;
export type PatchMovieRequest = z.infer<typeof patchMovieSchema>;
export type ListMoviesQuery = z.infer<typeof listMoviesQuerySchema>;
