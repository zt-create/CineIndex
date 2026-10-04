import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatRuntime } from '@cinelndex/shared';
import { ErrorMessage, Spinner } from '../components';
import { useDeleteMovie, useMovie } from '../hooks';

/** 影片详情页：展示完整字段，并支持删除。 */
export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: movie, loading, error, refetch } = useMovie(id);
  const { deleteMovie, loading: deleting, error: deleteError } = useDeleteMovie();

  const handleDelete = async (): Promise<void> => {
    if (!movie) return;
    if (!window.confirm(`确定要删除《${movie.title}》吗？此操作不可撤销。`)) return;

    const result = await deleteMovie(movie.id);
    // 失败时保留当前页面并展示 deleteError；成功才回列表页。
    if (result.ok) void navigate('/', { replace: true });
  };

  if (loading) return <Spinner label="正在加载影片详情…" />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  if (!movie) return <p className="empty-state">影片不存在。</p>;

  return (
    <article className="movie-detail">
      <Link className="back-link" to="/">
        ← 返回列表
      </Link>

      <header>
        <h1>{movie.title}</h1>
        {movie.originalTitle && <p className="movie-detail__original">{movie.originalTitle}</p>}
      </header>

      <dl className="movie-detail__meta">
        <div>
          <dt>上映年份</dt>
          <dd>{movie.releaseYear}</dd>
        </div>
        <div>
          <dt>类型</dt>
          <dd>{movie.genre}</dd>
        </div>
        <div>
          <dt>导演</dt>
          <dd>{movie.director}</dd>
        </div>
        <div>
          <dt>时长</dt>
          <dd>{formatRuntime(movie.runtimeMinutes)}</dd>
        </div>
        <div>
          <dt>评分</dt>
          <dd>{movie.rating === null ? '暂无评分' : movie.rating.toFixed(1)}</dd>
        </div>
        <div>
          <dt>录入时间</dt>
          <dd>{new Date(movie.createdAt).toLocaleString('zh-CN')}</dd>
        </div>
      </dl>

      {movie.synopsis && (
        <section className="movie-detail__synopsis">
          <h2>剧情简介</h2>
          <p>{movie.synopsis}</p>
        </section>
      )}

      {deleteError && <ErrorMessage error={deleteError} />}

      <div className="movie-detail__actions">
        <button
          type="button"
          className="button button--danger"
          disabled={deleting}
          onClick={() => void handleDelete()}
        >
          {deleting ? '删除中…' : '删除这部影片'}
        </button>
      </div>
    </article>
  );
}
