import { config } from '../config/env.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function serialize(meta: unknown): string {
  if (meta === undefined) return '';
  if (meta instanceof Error) {
    return ` ${meta.stack ?? meta.message}`;
  }
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return ' [meta 无法序列化]';
  }
}

/**
 * 极简结构化日志器。
 *
 * 依赖为零：开发时输出人类可读的一行，生产环境输出单行 JSON，
 * 便于被容器日志采集器直接解析。需要更强能力（采样、上报、脱敏）时
 * 再换成 pino，调用点不用改。
 */
function createLogger() {
  const threshold = LEVEL_WEIGHT[config.logLevel];

  function emit(level: LogLevel, message: string, meta?: unknown): void {
    if (LEVEL_WEIGHT[level] < threshold) return;

    const line = config.isProduction
      ? JSON.stringify({
          level,
          time: new Date().toISOString(),
          service: config.serviceName,
          msg: message,
          ...(meta === undefined ? {} : { meta: meta instanceof Error ? meta.message : meta }),
        })
      : `${new Date().toISOString()} [${level.toUpperCase().padEnd(5)}] ${message}${serialize(meta)}`;

    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  return {
    debug: (message: string, meta?: unknown) => emit('debug', message, meta),
    info: (message: string, meta?: unknown) => emit('info', message, meta),
    warn: (message: string, meta?: unknown) => emit('warn', message, meta),
    error: (message: string, meta?: unknown) => emit('error', message, meta),
  };
}

export const logger = createLogger();
export type Logger = typeof logger;
