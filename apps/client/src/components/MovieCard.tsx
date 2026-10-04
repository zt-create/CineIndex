import { Link } from 'react-router-dom';
import { formatRuntime, type Movie } from '@cinelndex/shared';

interface MovieCardProps {
  movie: Movie;
}

/** 列表页的单个影片卡片。 */
export function MovieCard({ movie }: MovieCardProps) {
  return (
    <article className="movie-card">
      <Link className="movie-card__title" to={`/movies/${movie.id}`}>
        {movie.title}
      </Link>

      {movie.originalTitle && <p className="movie-card__original">{movie.originalTitle}</p>}

      <dl className="movie-card__meta">
        <div>
          <dt>年份</dt>
          <dd>{movie.releaseYear}</dd>
        </div>
        <div>
          <dt>类型</dt>
          <dd>{movie.genre}</dd>
        </div>
        <div>
          <dt>时长</dt>
          <dd>{formatRuntime(movie.runtimeMinutes)}</dd>
        </div>
      </dl>

      <p className="movie-card__director">导演：{movie.director}</p>

      {movie.synopsis && <p className="movie-card__synopsis">{movie.synopsis}</p>}

      <span className="movie-card__rating">
        {movie.rating === null ? '暂无评分' : `★ ${movie.rating.toFixed(1)}`}
      </span>
    </article>
  );
}
