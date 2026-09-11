# 家政 AI 正式 V1 基础

## 运行模式

- GitHub Pages 使用 `npm run build:pages`，固定为静态 Demo 模式，继续使用浏览器演示数据。
- 正式服务器使用 `docker compose up -d`，由 Nginx 提供前端并反向代理 `/api/v1/` 到 Fastify，数据写入 PostgreSQL。

## 本地正式环境

1. 复制 `.env.example` 为 `.env`。
2. 替换 PostgreSQL 密码、JWT 密钥和管理员密码。
3. 执行 `docker compose up -d --build`。
4. 访问 `http://localhost`，使用 `.env` 中配置的管理员账号登录。

后端容器启动时自动执行 Drizzle migration 和幂等 Seed。`production` 只初始化角色与首个管理员，不写入演示业务数据；`development` / `demo` / `test` 才创建示例客户、人员、订单与排期。数据库使用命名 Volume `postgres_data` 持久化。

## 数据与安全

- 用户密码使用 Node.js `scrypt`、每个密码独立随机盐，并只保存哈希。
- API 使用 8 小时 Bearer JWT；每个正式业务接口同时校验 Token、用户状态与服务端令牌版本，退出登录后旧令牌立即失效。
- `admin` 可以管理账号并执行全部业务操作；客服/销售可维护客户和订单，派单可维护人员、订单和排期，财务第一阶段为只读。
- 客户、人员、订单和排期均使用 PostgreSQL UUID 主键；核心实体删除为软删除。
- PostgreSQL 排期表使用 GiST 排除约束，应用层同时返回中文冲突提示。
- 数据库同时约束预算区间、订单日期/金额和排期时间区间，避免绕过 API 写入无效数据。
- 修改订单的人员、日期或状态时，关联排期在同一数据库事务中同步更新并重新检查冲突。
- 时间戳使用 `timestamptz`，业务日期按 `Asia/Shanghai` 解释和显示。

## API

统一前缀 `/api/v1`：

- `POST /auth/login`、`POST /auth/logout`、`GET /auth/me`
- `GET /roles`
- `GET/POST /users`、`PATCH /users/:id`
- `GET/POST /customers`、`GET/PATCH/DELETE /customers/:id`
- `GET/POST /workers`、`GET/PATCH/DELETE /workers/:id`
- `GET/POST /orders`、`GET/PATCH/DELETE /orders/:id`
- `GET/POST /schedules`、`PATCH/DELETE /schedules/:id`

所有失败响应统一为 `{ "error": { "code", "message", "details?" } }`。
