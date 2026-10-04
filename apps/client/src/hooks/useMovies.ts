import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@cinelndex/shared';
import type { Movie, MovieGenre, Paginated, SortOrder } from '@cinelndex/shared';
import { moviesApi } from '../api/movies';

export interface MoviesQueryParams {
  search: string;
  /** null 表示「全部类型」。 */
  genre: MovieGenre | null;
  page: number;
  pageSize: number;
  sort?: 'title' | 'releaseYear' | 'rating' | 'createdAt';
  order?: SortOrder;
}

const EMPTY_RESULT: Paginated<Movie> = {
  items: [],
  page: 1,
  pageSize: 0,
  total: 0,
  totalPages: 0,
};

/**
 * 拉取影片列表。
 *
 * 细节说明：
 * - 依赖数组逐字段展开而不是 JSON.stringify(params)，参数顺序变化不会误触发请求；
 * - 用 AbortController 取消上一次请求，避免快速切换筛选时旧响应覆盖新响应（竞态）。
 */
export function useMovies(params: MoviesQueryParams) {
  const { search, genre, page, pageSize, sort, order } = params;

  const [data, setData] = useState<Paginated<Movie>>(EMPTY_RESULT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    setLoading(true);
    setError(null);

    moviesApi
      .list({ search, ...(genre ? { genre } : {}), page, pageSize, sort, order }, controller.signal)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(
          cause instanceof ApiError ? cause : new ApiError(0, 'INTERNAL_ERROR', '加载影片列表失败'),
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [search, genre, page, pageSize, sort, order, version]);

  return { data, loading, error, refetch };
}
