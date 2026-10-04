import { Link, useNavigate } from 'react-router-dom';
import type { CreateMovieInput } from '@cinelndex/shared';
import { ErrorMessage, MovieForm } from '../components';
import { useCreateMovie } from '../hooks';

/** 新增影片页：提交成功后跳到详情页。 */
export function NewMoviePage() {
  const navigate = useNavigate();
  const { createMovie, loading, error } = useCreateMovie();

  const handleSubmit = async (input: CreateMovieInput): Promise<void> => {
    const result = await createMovie(input);
    if (result.ok) void navigate(`/movies/${result.data.id}`, { replace: true });
    // 失败时 error 已经有值，下面会渲染出字段级错误。
  };

  return (
    <section>
      <Link className="back-link" to="/">
        ← 返回列表
      </Link>

      <header className="page-header">
        <div>
          <h1>新增影片</h1>
          <p className="page-header__subtitle">带 * 的字段必填</p>
        </div>
      </header>

      {error && <ErrorMessage error={error} />}

      <MovieForm submitLabel="保存" loading={loading} onSubmit={handleSubmit} />
    </section>
  );
}
