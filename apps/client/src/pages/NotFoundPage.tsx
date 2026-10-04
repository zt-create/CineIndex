import { Link } from 'react-router-dom';

/** 兜底路由。 */
export function NotFoundPage() {
  return (
    <section className="empty-state">
      <h1>404</h1>
      <p>这个页面不存在。</p>
      <Link className="back-link" to="/">
        ← 回到影片列表
      </Link>
    </section>
  );
}
