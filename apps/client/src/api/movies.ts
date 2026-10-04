import type { CreateMovieInput, Movie, MovieQuery, Paginated } from '@cinelndex/shared';
import { httpClient } from './client';

/** 影片接口封装：hooks 只调用这里，不直接碰 httpClient 的路径字符串。 */
export const moviesApi = {
  list(query: MovieQuery = {}, signal?: AbortSignal): Promise<Paginated<Movie>> {
    return httpClient.get<Paginated<Movie>>('/movies', {
      query: {
        search: query.search,
        genre: query.genre,
        page: query.page,
        pageSize: query.pageSize,
        sort: query.sort,
        order: query.order,
      },
      ...(signal ? { signal } : {}),
    });
  },

  getById(id: string, signal?: AbortSignal): Promise<Movie> {
    return httpClient.get<Movie>(`/movies/${encodeURIComponent(id)}`, {
      ...(signal ? { signal } : {}),
    });
  },

  create(input: CreateMovieInput): Promise<Movie> {
    return httpClient.post<Movie>('/movies', input);
  },

  replace(id: string, input: CreateMovieInput): Promise<Movie> {
    return httpClient.put<Movie>(`/movies/${encodeURIComponent(id)}`, input);
  },

  patch(id: string, input: Partial<CreateMovieInput>): Promise<Movie> {
    return httpClient.patch<Movie>(`/movies/${encodeURIComponent(id)}`, input);
  },

  remove(id: string): Promise<void> {
    return httpClient.delete<void>(`/movies/${encodeURIComponent(id)}`);
  },
};
