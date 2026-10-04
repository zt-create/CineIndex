/**
 * 接口回归测试：`pnpm --filter @cinelndex/server test`
 *
 * 用 Node 内置的 node:test + node:assert，不引入 jest/vitest，
 * 被测对象是 createApp() 返回的 Express 实例（supertest 的替代品就是内置 fetch）。
 *
 * 覆盖的是「不依赖数据库也能判定」的行为：HTTP 语义、参数校验、错误体格式、CORS。
 * 需要真实数据库的查询逻辑，请配合 `db:migrate` + `db:seed` 手工验证。
 *
 * 注意：测试运行在 dist/ 上（先 tsc 再 node），端口用 0，让系统随机分配。
 */

import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { after, before, describe, it } from 'node:test';
import { API_PREFIX } from '@cinelndex/shared';
import { createApp } from '../src/app.js';
import { closePool } from '../src/db/pool.js';

let server: Server;
let baseUrl: string;

/** 记录响应头，便于断言 x-request-id / CORS 这类中间件效果。 */
async function call(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: unknown; headers: Headers }> {
  const response = await fetch(`${baseUrl}${path}`, init);
  const text = await response.text();
  const body: unknown = text.length > 0 ? JSON.parse(text) : null;
  return { status: response.status, body, headers: response.headers };
}

function jsonInit(method: string, payload: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

before(async () => {
  server = createApp().listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));

  const address = server.address();
  assert.ok(address && typeof address === 'object', '服务器应当拿到监听地址');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  // 没有数据库时 pool.end() 也是安全的空操作。
  await closePool();
});

describe('健康检查', () => {
  it('数据库不可用时返回 503 且结构完整', async () => {
    const { status, body } = await call('/health');
    const health = body as { status: string; database: { connected: boolean } };

    assert.equal(status, 503);
    assert.equal(health.status, 'degraded');
    assert.equal(health.database.connected, false);
  });

  it('每个响应都带上 x-request-id', async () => {
    const { headers } = await call('/health');
    assert.ok(headers.get('x-request-id'), 'x-request-id 不应为空');
  });
});

describe('入参校验', () => {
  it('非法 UUID 返回 422 与字段级错误', async () => {
    const { status, body } = await call(`${API_PREFIX}/movies/not-a-uuid`);
    const payload = body as { error: { code: string; details: { field: string }[] } };

    assert.equal(status, 422);
    assert.equal(payload.error.code, 'VALIDATION_ERROR');
    assert.equal(payload.error.details[0]?.field, 'id');
  });

  it('缺字段 / 越界 / 非法枚举一次性全部报出', async () => {
    const { status, body } = await call(
      `${API_PREFIX}/movies`,
      jsonInit('POST', { title: '', releaseYear: 1700, genre: 'kungfu', director: '' }),
    );
    const payload = body as { error: { code: string; details: { field: string }[] } };
    const fields = payload.error.details.map((detail) => detail.field).sort();

    assert.equal(status, 422);
    assert.deepEqual(fields, ['director', 'genre', 'releaseYear', 'title']);
  });

  it('请求体不是合法 JSON 时返回 400', async () => {
    const { status, body } = await call(`${API_PREFIX}/movies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{oops',
    });

    assert.equal(status, 400);
    assert.equal((body as { error: { code: string } }).error.code, 'BAD_REQUEST');
  });
});

describe('路由与错误体', () => {
  it('未注册的路由返回 404 与统一错误体', async () => {
    const { status, body } = await call(`${API_PREFIX}/does-not-exist`);
    const payload = body as { error: { code: string; message: string } };

    assert.equal(status, 404);
    assert.equal(payload.error.code, 'NOT_FOUND');
    assert.match(payload.error.message, /does-not-exist/);
  });

  it('CORS 白名单内的来源被放行', async () => {
    const { headers } = await call('/health', {
      headers: { Origin: 'http://localhost:5173' },
    });
    assert.equal(headers.get('access-control-allow-origin'), 'http://localhost:5173');
  });
});
