import type { Request, Response } from 'express';
import type { z } from 'zod';
import type { Movie, Paginated } from '@cinelndex/shared';
import { movieService } from '../services/movie.service.js';
import {
  createMovieSchema,
  listMoviesQuerySchema,
  movieIdSchema,
  patchMovieSchema,
} from '../schemas/movie.schema.js';

/**
 * controller 层只做三件事：把请求数据取出来 → 交给 service → 决定状态码。
 * 这里不写 SQL，也不做业务规则判断。
 */

type CreateMovieBody = z.infer<typeof createMovieSchema>;
type PatchMovieBody = z.infer<typeof patchMovieSchema>;
type ListMoviesQuery = z.infer<typeof listMoviesQuerySchema>;
type MovieIdParams = z.infer<typeof movieIdSchema>;

/** `validate()` 中间件已经把解析结果写回了 req，这里只是把它读出来。 */
function validated<T>(value: unknown): T {
  return value as T;
}

/** GET /api/v1/movies */
export async function listMovies(req: Request, res: Response<Paginated<Movie>>): Promise<void> {
  const { search, genre, page, pageSize, sort, order } = validated<ListMoviesQuery>(req.query);

  const result = await movieService.list({ search, genre, page, pageSize, sort, order });
  res.json(result);
}

/** GET /api/v1/movies/:id */
export async function getMovie(req: Request, res: Response<Movie>): Promise<void> {
  const { id } = validated<MovieIdParams>(req.params);
  const movie = await movieService.getById(id);
  res.json(movie);
}

/** POST /api/v1/movies */
export async function createMovie(req: Request, res: Response<Movie>): Promise<void> {
  const body = validated<CreateMovieBody>(req.body);
  const movie = await movieService.create(body);
  res.status(201).location(`/api/v1/movies/${movie.id}`).json(movie);
}

/** PUT /api/v1/movies/:id —— 整体替换 */
export async function replaceMovie(req: Request, res: Response<Movie>): Promise<void> {
  const { id } = validated<MovieIdParams>(req.params);
  const body = validated<CreateMovieBody>(req.body);
  const movie = await movieService.update(id, body, false);
  res.json(movie);
}

/** PATCH /api/v1/movies/:id —— 局部更新 */
export async function patchMovie(req: Request, res: Response<Movie>): Promise<void> {
  const { id } = validated<MovieIdParams>(req.params);
  const body = validated<PatchMovieBody>(req.body);
  const movie = await movieService.update(id, body, true);
  res.json(movie);
}

/** DELETE /api/v1/movies/:id */
export async function deleteMovie(req: Request, res: Response): Promise<void> {
  const { id } = validated<MovieIdParams>(req.params);
  await movieService.remove(id);
  res.status(204).send();
}
