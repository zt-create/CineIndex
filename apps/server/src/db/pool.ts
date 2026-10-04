import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * 全局连接池。
 *
 * 整个进程共用一个 Pool，它自己负责连接的复用与回收；
 * 千万不要在请求处理里 `new Pool()`，也不要手动 `connect()` 后忘记 `release()`。
 */
export const pool = new Pool({
  connectionString: config.db.url,
  max: config.db.max,
  idleTimeoutMillis: config.db.idleTimeoutMillis,
  connectionTimeoutMillis: config.db.connectionTimeoutMillis,
  application_name: config.serviceName,
});

// 空闲连接被服务端断开等情况会在这里冒出来。没有监听器时 pg 会直接让进程崩溃。
pool.on('error', (error: Error) => {
  logger.error('PostgreSQL 连接池发生错误', error);
});

/** 执行参数化查询。永远用 `$1, $2` 占位，不要拼字符串，避免 SQL 注入。 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: readonly unknown[] = [],
): Promise<QueryResult<T>> {
  const startedAt = Date.now();
  const result = await pool.query<T>(sql, params as unknown[]);

  if (config.db.logging) {
    logger.debug(`SQL ${Date.now() - startedAt}ms`, { sql, rows: result.rowCount });
  }

  return result;
}

/** 在一个事务里执行回调；抛错自动回滚，`finally` 里一定归还连接。 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch((rollbackError: unknown) => {
      logger.error('事务回滚失败', rollbackError);
    });
    throw error;
  } finally {
    client.release();
  }
}

/** 健康检查用的探针：返回往返耗时。 */
export async function pingDatabase(): Promise<number> {
  const startedAt = Date.now();
  await query('SELECT 1');
  return Date.now() - startedAt;
}

/** 优雅退出：等待在途查询结束后关闭所有连接。 */
export async function closePool(): Promise<void> {
  await pool.end();
}
