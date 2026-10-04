import { NavLink, Outlet } from 'react-router-dom';
import { appConfig } from './config';

/**
 * 应用外壳：顶部导航 + 内容出口。
 * 具体页面通过 react-router 的 <Outlet /> 渲染，避免每页重复写导航。
 */
export function App() {
  return (
    <div className="app">
      <header className="app__header">
        <NavLink className="app__brand" to="/">
          {appConfig.appName}
        </NavLink>

        <nav className="app__nav">
          <NavLink to="/" end>
            影片列表
          </NavLink>
          <NavLink to="/movies/new">新增影片</NavLink>
        </nav>
      </header>

      <main className="app__main">
        <Outlet />
      </main>

      <footer className="app__footer">
        <span>PostgreSQL + Express + React + Node · pnpm monorepo</span>
      </footer>
    </div>
  );
}
