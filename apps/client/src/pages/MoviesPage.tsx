import { useEffect, useState } from 'react';
import type { MovieGenre } from '@cinelndex/shared';
import { ErrorMessage, MovieCard, Pagination, SearchBar, Spinner } from '../components';
import { useDebouncedValue, useMovies } from '../hooks';

const PAGE_SIZE = 12;

/** 首页：影片列表 + 搜索 + 类型筛选 + 分页。 */
export function MoviesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [genre, setGenre] = useState<MovieGenre | null>(null);
  const [page, setPage] = useState(1);

  // 输入停下 300ms 后才真正查询。
  const search = useDebouncedValue(searchInput, 300);

  // 换了筛选条件就回到第一页，否则可能停在一个不存在的页码上。
  useEffect(() => {
    setPage(1);
  }, [search, genre]);

  const { data, loading, error, refetch } = useMovies({
    search,
    genre,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>影片索引</h1>
          <p className="page-header__subtitle">共 {data.total} 条记录</p>
        </div>
      </header>

      <SearchBar
        search={searchInput}
        genre={genre}
        onSearchChange={setSearchInput}
        onGenreChange={setGenre}
      />

      {error && <ErrorMessage error={error} onRetry={refetch} />}

      {loading && <Spinner label="正在加载影片…" />}

      {!loading && !error && data.items.length === 0 && (
        <p className="empty-state">
          没有匹配的影片。试试换个关键字，或者到「新增影片」里录入一条。
        </p>
      )}

      <div className="movie-grid">
        {data.items.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>

      {data.total > 0 && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
      )}
    </section>
  );
}
