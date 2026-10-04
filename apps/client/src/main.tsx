import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { App } from './App';
import { MovieDetailPage, MoviesPage, NewMoviePage, NotFoundPage } from './pages';
import './styles/global.css';

const container = document.getElementById('root');
if (!container) throw new Error('找不到 #root 挂载节点，请检查 index.html');

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<MoviesPage />} />
          <Route path="movies" element={<Navigate to="/" replace />} />
          <Route path="movies/new" element={<NewMoviePage />} />
          <Route path="movies/:id" element={<MovieDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
