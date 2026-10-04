/**
 * 极简 SQL 迁移器：`src/db/migrations/*.sql` 按文件名升序执行，每个文件只跑一次。
 *
 * 用法（在 apps/server 目录下）：
 *   pnpm db:migrate    执行尚未应用的迁移
 *   pnpm db:status     查看已应用 / 待应用的迁移
 *   pnpm db:rollback   删除 public schema 后重跑（仅限开发，见下方保护）
 *
 * 之所以不直接上 Prisma / Drizzle：脚手架阶段保持「SQL 就是事实来源」，
 * 迁移文件可以直接粘进 psql 排查问题，也不会被 ORM 版本升级绑住。
 */

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { closePool, pool } from './pool.js';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

interface MigrationFile {
  id: string;
  name: string;
  path: string;
}

interface AppliedRow {
  id: string;
  name: string;
  applied_at: Date;
}

async function listMigrationFiles(): Promise<MigrationFile[]> {
  const entries = await readdir(MIGRATIONS_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => {
      const [id = entry.name, ...rest] = entry.name.replace(/\.sql$/, '').split('_');
      return { id, name: rest.join('_') || id, path: join(MIGRATIONS_DIR, entry.name) };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function listApplied(): Promise<AppliedRow[]> {
  const { rows } = await pool.query<AppliedRow>(
    'SELECT id, name, applied_at FROM schema_migrations ORDER BY id',
  );
  return rows;
}

async function up(): Promise<void> {
  await ensureMigrationsTable();
  const [files, applied] = await Promise.all([listMigrationFiles(), listApplied()]);
  const appliedIds = new Set(applied.map((row) => row.id));
  const pending = files.filter((file) => !appliedIds.has(file.id));

  if (pending.length === 0) {
    logger.info('数据库已是最新，无需迁移');
    return;
  }

  for (const file of pending) {
    const sql = await readFile(file.path, 'utf8');
    const client = await pool.connect();
    try {
      // 每个迁移文件单独一个事务：失败时该文件整体回滚，不会留下半截结构。
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (id, name) VALUES ($1, $2)', [
        file.id,
        file.name,
      ]);
      await client.query('COMMIT');
      logger.info(`已应用迁移 ${file.id}_${file.name}`);
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      logger.error(`迁移 ${file.id}_${file.name} 失败，已回滚`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  logger.info(`迁移完成，共应用 ${pending.length} 个文件`);
}

async function status(): Promise<void> {
  await ensureMigrationsTable();
  const [files, applied] = await Promise.all([listMigrationFiles(), listApplied()]);
  const appliedMap = new Map(applied.map((row) => [row.id, row]));

  console.log('\n迁移状态：');
  for (const file of files) {
    const record = appliedMap.get(file.id);
    const mark = record ? '✔ 已应用' : '· 待应用';
    const when = record ? ` @ ${record.applied_at.toISOString()}` : '';
    console.log(`  ${mark}  ${file.id}_${file.name}${when}`);
  }
  console.log('');
}

/** 开发期重置：整库删除后由调用方重新执行 up。 */
async function down(): Promise<void> {
  if (config.isProduction) {
    throw new Error('生产环境禁止执行 db:rollback');
  }
  logger.warn('正在删除 public schema —— 所有数据都会丢失');
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
  await pool.query('CREATE SCHEMA public');
  logger.info('schema 已重建');
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'up';

  switch (command) {
    case 'up':
      await up();
      break;
    case 'down':
      await down();
      break;
    case 'status':
      await status();
      break;
    default:
      console.error(`未知命令 "${command}"，可用命令：up | down | status`);
      process.exitCode = 1;
  }
}

main()
  .catch((error: unknown) => {
    logger.error('迁移执行失败', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void closePool();
  });
