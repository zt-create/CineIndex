/**
 * 环境变量读取与校验。
 *
 * 单一出口：应用其它部分只从 `config` 取值，绝不直接读 `process.env`，
 * 这样配置项缺失时会在启动阶段就报错，而不是在某个请求里突然 `undefined`。
 */

function readString(key: string, fallback: string): string {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === '') return fallback;
  return raw.trim();
}

function readOptionalString(key: string): string | undefined {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === '') return undefined;
  return raw.trim();
}

function readNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`环境变量 ${key} 必须是数字，当前值为 "${raw}"`);
  }
  return parsed;
}

function readBoolean(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase());
}

const nodeEnv = readString('NODE_ENV', 'development');
const databaseUrl = readOptionalString('DATABASE_URL');

export const config = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: readNumber('PORT', 4000),
  serviceName: 'cinelndex-api',
  serviceVersion: '0.1.0',

  cors: {
    /** 逗号分隔的白名单；`*` 表示允许任意来源。 */
    origins: readString('CORS_ORIGIN', 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  },

  db: {
    url: databaseUrl ?? 'postgresql://cinelndex:cinelndex@localhost:5432/cinelndex',
    max: readNumber('PGPOOL_MAX', 10),
    idleTimeoutMillis: readNumber('PGPOOL_IDLE_TIMEOUT_MS', 30_000),
    connectionTimeoutMillis: readNumber('PGPOOL_CONNECTION_TIMEOUT_MS', 5_000),
    logging: readBoolean('DB_LOGGING', false),
  },

  logLevel: readString('LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',
} as const;

export type AppConfig = typeof config;

/** 启动前自检：把明显的配置错误提前暴露出来。 */
export function assertConfig(): void {
  if (!config.db.url.startsWith('postgres')) {
    throw new Error('DATABASE_URL 必须是一个 PostgreSQL 连接串');
  }
  if (config.port <= 0 || config.port > 65_535) {
    throw new Error(`PORT 不在合法范围内：${config.port}`);
  }
}
