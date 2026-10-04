/**
 * 构建后处理：把 src 下的非 TS 资源（SQL 迁移文件）复制到 dist。
 *
 * 为什么需要它：tsc 只输出 .ts 编译结果，`.sql` 不在它的处理范围内，
 * 而迁移器运行时要按文件名读取这些文件。用 Node 而不是 `cp`/`xcopy`，
 * 是为了在 Windows / macOS / Linux 上行为一致。
 *
 * 用法：node scripts/copy-assets.mjs
 */

import { cp, mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/** [源目录(相对项目根), 目标目录(相对项目根)] */
const ASSETS = [['src/db/migrations', 'dist/db/migrations']];

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  for (const [from, to] of ASSETS) {
    const source = join(projectRoot, from);
    const target = join(projectRoot, to);

    if (!(await exists(source))) {
      console.warn(`[copy-assets] 跳过：源目录不存在 ${from}`);
      continue;
    }

    await mkdir(dirname(target), { recursive: true });
    await cp(source, target, { recursive: true });
    console.log(`[copy-assets] ${from} → ${to}`);
  }
}

await main();
