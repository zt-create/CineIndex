import { MOVIE_GENRES, type MovieGenre } from '@cinelndex/shared';

interface SearchBarProps {
  search: string;
  genre: MovieGenre | null;
  onSearchChange: (value: string) => void;
  onGenreChange: (value: MovieGenre | null) => void;
}

/** 关键字 + 类型筛选。受控组件，状态由页面持有。 */
export function SearchBar({ search, genre, onSearchChange, onGenreChange }: SearchBarProps) {
  return (
    <div className="search-bar">
      <label className="search-bar__field">
        <span>搜索</span>
        <input
          type="search"
          value={search}
          placeholder="片名或导演…"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <label className="search-bar__field">
        <span>类型</span>
        <select
          value={genre ?? ''}
          onChange={(event) =>
            onGenreChange(event.target.value === '' ? null : (event.target.value as MovieGenre))
          }
        >
          <option value="">全部</option>
          {MOVIE_GENRES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
