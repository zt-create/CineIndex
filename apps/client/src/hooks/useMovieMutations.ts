import type { CreateMovieInput, Movie } from '@cinelndex/shared';
import { moviesApi } from '../api/movies';
import { useAsyncAction, type ActionResult } from './useAsyncAction';

/**
 * 影片写操作。三个 hook 的形态一致：
 *   const result = await createMovie(input);
 *   if (result.ok) { ... }
 * 同时提供 `loading` / `error` 供 UI 直接渲染。
 */

export function useCreateMovie() {
  const { run, loading, error, reset } = useAsyncAction<[CreateMovieInput], Movie>(
    (input) => moviesApi.create(input),
  );
  return { createMovie: run, loading, error, reset };
}

export function useUpdateMovie() {
  const { run, loading, error, reset } = useAsyncAction<[string, Partial<CreateMovieInput>], Movie>(
    (id, input) => moviesApi.patch(id, input),
  );
  return { updateMovie: run, loading, error, reset };
}

export function useDeleteMovie() {
  const { run, loading, error, reset } = useAsyncAction<[string], void>((id) =>
    moviesApi.remove(id),
  );
  return { deleteMovie: run, loading, error, reset };
}

export type { ActionResult };
