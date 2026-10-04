# Cinelndex Webapp

PostgreSQL + Express + React + Node 的 pnpm monorepo 脚手架，用一个「影片索引」的小应用把整条链路串起来：
数据库迁移、Service/Controller 分层、参数校验、统一错误体、前端 API 封装与 hooks。

## 目录结构

```
cinelndex-webapp/
├── apps/
│   ├── client/                 # React 19 + Vite 前端
│   │   ├── src/
│   │   │   ├── api/            # fetch 封装 + 各资源接口
│   │   │   ├── components/     # 展示型组件
│   │   │   ├── hooks/          # 数据获取与写操作 hooks
│   │   │   ├── pages/          # 路由页面
│   │   │   ├── styles/         # 全局样式
│   │   │   ├── App.tsx         # 应用外壳（导航 + Outlet）
│   │   │   ├── config.ts       # 前端配置唯一出口
│   │   │   └── main.tsx        # 入口 + 路由表
│   │   └── package.json
│   └── server/                 # Express 5 后端
│       ├── src/
│       │   ├── config/         # 环境变量、日志
│       │   ├── controllers/    # 请求处理（取参 → 调 service → 定状态码）
│       │   ├── db/             # 连接池、迁移器、迁移 SQL、种子数据
│       │   ├── middleware/     # 请求上下文、日志、校验、错误处理
│       │   ├── routes/         # 路由定义
│       │   ├── schemas/        # zod 校验 schema
│       │   ├── services/       # 业务逻辑与 SQL
│       │   ├── types/          # Express 类型增强
│       │   ├── app.ts          # 组装 Express 应用（可被测试直接引用）
│       │   └── index.ts        # 进程入口 + 优雅退出
│       ├── test/               # node:test 接口回归测试
│       └── package.json
├── packages/
│   └── shared/                 # 前后端共享类型与工具（零运行时依赖）
│       └── src/
│           ├── types/          # 领域模型、HTTP 契约
│           ├── utils/          # ApiError、分页归一化、格式化
│           └── index.ts
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.json               # 根级 TypeScript 基准配置
```

## 快速开始

```powershell
# 0. 前置：Node >= 20.11、pnpm >= 9、Docker（用于起 PostgreSQL）
pnpm install

# 1. 复制环境变量
Copy-Item apps/server/.env.example apps/server/.env
Copy-Item apps/client/.env.example apps/client/.env

# 2. 起数据库（默认 5432）
pnpm db:up

# 3. 建表 + 灌演示数据
pnpm db:migrate
pnpm db:seed

# 4. 同时启动前后端
pnpm dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:4000
- 健康检查：http://localhost:4000/health

> 本机 5432 已被其它 PostgreSQL 占用时，用备用端口起容器：
> `$env:POSTGRES_HOST_PORT=55432; pnpm db:up`，同时把 `apps/server/.env` 里 `DATABASE_URL` 的端口改成 `55432`。
> 也可以直接用本机已有的 PostgreSQL，只改 `DATABASE_URL` 即可。

## 常用命令

在仓库根目录执行：

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 先构建 shared，再并行启动 server 与 client |
| `pnpm dev:server` / `pnpm dev:client` | 只启动其中一个 |
| `pnpm build` | 构建 shared → server → client |
| `pnpm typecheck` | 三个包全量类型检查 |
| `pnpm db:up` / `pnpm db:down` | 起停 PostgreSQL 容器 |
| `pnpm db:migrate` | 执行未应用的迁移 |
| `pnpm db:seed` | 写入演示数据（幂等） |
| `pnpm db:reset` | 删库重建 + 重新灌数据，**仅开发环境** |
| `pnpm --filter @cinelndex/server db:status` | 查看迁移状态 |
| `pnpm --filter @cinelndex/server test` | 接口回归测试（无需数据库） |
| `pnpm clean` | 删除各包的 `dist` 与根 `node_modules` |

> 清理脚本用 Node 自带的 `fs.rmSync`，没有引入 `rimraf` 之类的额外依赖。

## 环境变量

`apps/server/.env`：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NODE_ENV` | `development` | 生产模式下错误信息不外泄 |
| `PORT` | `4000` | 后端监听端口 |
| `CORS_ORIGIN` | `http://localhost:5173` | 白名单，逗号分隔，`*` 表示全放行 |
| `DATABASE_URL` | 本地默认实例 | PostgreSQL 连接串 |
| `PGPOOL_MAX` | `10` | 连接池上限 |
| `DB_LOGGING` | `false` | 打印 SQL |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |

`apps/client/.env`：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 空 | 留空走 Vite 代理（同源 `/api`）；填绝对地址则直连后端 |
| `VITE_PROXY_TARGET` | `http://localhost:4000` | 代理目标 |

## API

统一前缀 `/api/v1`，成功直接返回数据，失败统一为 `{ error: { code, message, details? } }`。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/health` | 探针，依赖不可用时返回 503 |
| `GET` | `/api/v1/movies` | 列表，支持 `search` `genre` `page` `pageSize` `sort` `order` |
| `GET` | `/api/v1/movies/:id` | 详情 |
| `POST` | `/api/v1/movies` | 新建，成功 201 + `Location` |
| `PUT` | `/api/v1/movies/:id` | 整体替换（未提供的可空字段会被清空） |
| `PATCH` | `/api/v1/movies/:id` | 局部更新 |
| `DELETE` | `/api/v1/movies/:id` | 删除，成功 204 |

错误码：`VALIDATION_ERROR`(422)、`NOT_FOUND`(404)、`BAD_REQUEST`(400)、`CONFLICT`(409)、`INTERNAL_ERROR`(500)。

示例：

```powershell
curl.exe -s "http://localhost:4000/api/v1/movies?search=王家卫&pageSize=5"
curl.exe -s -X POST http://localhost:4000/api/v1/movies `
  -H "Content-Type: application/json" `
  --data-raw '{\"title\":\"一一\",\"releaseYear\":2000,\"genre\":\"drama\",\"director\":\"杨德昌\"}'
```

## 设计约定

- **shared 是单一事实来源**：领域类型、错误体、分页常量都放在 `@cinelndex/shared`，前端不再手写一遍接口类型，后端也不会和前端字段名漂移。它不依赖 Node 或 DOM，因此两端都能用。
- **分层的边界**：`routes`（路径 + 中间件链）→ `controllers`（取参、定状态码）→ `services`（业务规则 + SQL）。controller 里不写 SQL，service 里不碰 `req`/`res`。
- **校验在边界完成**：每个路由入口用 zod schema 校验并净化 `body`/`query`/`params`，进入 controller 的就已经是带默认值的强类型数据。
- **错误只有一条出口**：所有错误（含异步错误）都汇聚到 `middleware/errorHandler.ts`，在那里转成统一响应体；生产环境隐藏内部错误细节，只回 `requestId`。
- **前端错误即异常**：`api/client.ts` 把非 2xx 一律抛成 `ApiError`，hooks 只需处理「数据」或「错误」两种状态。
- **SQL 就是迁移的事实来源**：迁移是纯 `.sql` 文件，可以直接粘进 psql 排查；没有引入 ORM，避免被版本升级绑住。
- **写操作显式处理失败**：`useAsyncAction` 返回 `{ ok, data | error }`，调用方不会忘记处理错误分支。

## 已知限制

- 迁移器只支持向上迁移；`db:rollback` 的做法是删除 public schema 后重跑，仅限开发环境。
- 鉴权、限流、分页游标、软删除都还没做，属于脚手架预留的扩展点。
- 前端使用 `BrowserRouter`，部署到静态服务器时需要在服务端配置 history fallback（所有未知路径回落到 `index.html`）。
- `apps/server/.env` 与 `apps/client/.env` 已被 `.gitignore` 忽略，团队协作时通过 `.env.example` 同步变更。
