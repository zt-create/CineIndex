import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@cinelndex/shared';
import type { Movie } from '@cinelndex/shared';
import { moviesApi } from '../api/movies';

/** 拉取单部影片。`id` 为空（例如路由还没解析出参数）时不会发请求。 */
export function useMovie(id: string | undefined) {
  const [data, setData] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<ApiError | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setLoading(true);
    setError(null);

    moviesApi
      .getById(id, controller.signal)
      .then((movie) => {
        if (cancelled) return;
        setData(movie);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof ApiError ? cause : new ApiError(0, 'INTERNAL_ERROR', '加载失败'));
        setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id, version]);

  return { data, loading, error, refetch };
}
