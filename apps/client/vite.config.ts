import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { API_PREFIX } from '@cinelndex/shared';

const SERVER_ORIGIN = process.env.VITE_PROXY_TARGET ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 开发期让浏览器只跟 Vite 说话，/api 由 Vite 转发到 Express，
    // 于是前端代码里不需要写死后端地址，也不会有跨域问题。
    proxy: {
      [API_PREFIX]: {
        target: SERVER_ORIGIN,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  preview: {
    port: 4173,
  },
});
