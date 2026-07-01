# ScentPersona

中文香水人格测试与推荐平台。用户通过生活方式问卷获得"气味人格"匹配，得到个性化香氛推荐和小样套装购买方案。

## 技术栈

- **框架**: Next.js 14 (App Router) + TypeScript
- **样式**: Tailwind CSS
- **数据库**: Neon PostgreSQL (Serverless Postgres)
- **ORM**: Prisma 5
- **测试**: Vitest (单元) + Playwright (E2E)
- **部署**: Vercel

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量
cp .env.example .env
# 编辑 .env，填入你的 Neon 数据库连接字符串

# 3. 应用数据库迁移
npx prisma migrate deploy

# 4. 启动开发服务器
npm run dev
```

## Vercel + Neon 部署指南

### 自动创建数据库（推荐）

1. **在 Vercel 安装 Neon Integration**
   - 进入 Vercel Dashboard → 你的项目 → Settings → Integrations
   - 搜索 "Neon" 并安装 Neon Vercel Integration
   - 授权并选择 Neon 项目（或创建新项目）
   - Integration 会自动为每个 Preview/Production 部署创建对应的数据库分支
   - `DATABASE_URL` 和 `DIRECT_URL` 会自动注入为 Vercel 环境变量

2. **配置环境变量**
   - 在 Vercel 项目 Settings → Environment Variables 中确认以下变量存在：
     - `DATABASE_URL` — Neon pooled 连接字符串（带 `-pooler`，用于运行时）
     - `DIRECT_URL` — Neon 直连字符串（不带 `-pooler`，用于 migrations）
   - 如果 Neon Integration 未自动设置 `DIRECT_URL`，手动添加（将 `DATABASE_URL` 中的 `-pooler` 去掉即可）

3. **推送代码**
   ```bash
   git add .
   git commit -m "feat: switch to Neon PostgreSQL for Vercel deployment"
   git push origin main
   ```
   - Vercel 自动触发构建
   - 构建时执行 `node scripts/vercel-build.mjs`
   - `prisma migrate deploy` 会自动在 Neon 数据库上创建所有表
   - 如果 `DATABASE_URL`、`DIRECT_URL` 或 `ADMIN_PASSWORD` 缺失，构建会提前失败并提示去 Vercel Project Settings 配置环境变量

### 数据库迁移

- 修改 `prisma/schema.prisma` 后，创建新迁移：
  ```bash
  npx prisma migrate dev --name your_migration_name
  ```
- 提交 `prisma/migrations/` 目录到 git
- Vercel 构建时会自动执行 `prisma migrate deploy` 应用新迁移

## 项目结构

```
src/
├── app/              # Next.js App Router 页面和 API 路由
│   ├── api/          # API 路由 (quiz, order, payment, admin, privacy, feedback)
│   ├── admin/        # 受保护的运营看板和订单处理
│   ├── checkout/     # Web 订单结账
│   ├── order/        # 订单详情和支付状态页
│   ├── feedback/     # 试香反馈页面
│   ├── products/     # 产品列表和详情页
│   ├── quiz/         # 测验页面
│   ├── result/       # 测验结果页面
│   └── layout.tsx    # 根布局
├── components/       # React 组件
│   ├── common/       # 通用组件 (CopyButton)
│   ├── layout/       # 布局组件 (Header, Footer, PageShell)
│   ├── quiz/         # 测验组件
│   └── result/       # 结果页组件
├── data/             # 领域数据 (personas, products, scentTags, quizQuestions, copy)
└── lib/              # 工具库 (db, utils, compliance, scoring)
prisma/
├── schema.prisma     # 数据库模型定义
└── migrations/       # SQL 迁移文件
```

## 测试

```bash
# 单元测试
npm test

# 类型检查
npm run typecheck

# 本地 Next 构建校验，不执行数据库迁移
npm run build:local

# E2E 测试 (需要先启动 dev server)
npm run test:e2e
```

## 生产部署

完整的生产部署流程（Vercel + Neon、迁移与种子、真实支付/通知接入、微信/小红书小程序发布、实时 WS、上线自检、CI、安全合规清单）见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

初始化数据（法务协议、可推荐商品、会员等级、库存、示例专题页与优惠券）：

```bash
npx prisma migrate deploy && npx prisma generate
npx prisma db seed
```

### 演示数据与运营维护

```bash
npm run db:seed:demo       # 额外写入演示用户/订单，填充经营看板（生产勿用）
npm run import:products     # 从 data/products.csv 批量导入/更新商品与报价（运营维护）
npm run reset:demo -- --yes # 清空并重播演示数据（仅演示标记记录）
```

前台 `/c` 为专题聚合页，首页含"按香型探索 + 精选专题"推荐位。
