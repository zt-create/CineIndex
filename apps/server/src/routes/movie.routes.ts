import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  createMovieSchema,
  listMoviesQuerySchema,
  movieIdSchema,
  patchMovieSchema,
  updateMovieSchema,
} from '../schemas/movie.schema.js';
import {
  createMovie,
  deleteMovie,
  getMovie,
  listMovies,
  patchMovie,
  replaceMovie,
} from '../controllers/movie.controller.js';

/**
 * 影片资源路由。
 *
 * 一个路由 = 校验链 + 处理器，中间件顺序很容易一眼看全：
 * `validate(movieIdSchema, 'params')` → `validate(body)` → controller。
 */
export const moviesRouter: Router = Router();

moviesRouter
  .route('/')
  .get(validate(listMoviesQuerySchema, 'query'), asyncHandler(listMovies))
  .post(validate(createMovieSchema), asyncHandler(createMovie));

moviesRouter
  .route('/:id')
  .all(validate(movieIdSchema, 'params'))
  .get(asyncHandler(getMovie))
  .put(validate(updateMovieSchema), asyncHandler(replaceMovie))
  .patch(validate(patchMovieSchema), asyncHandler(patchMovie))
  .delete(asyncHandler(deleteMovie));
