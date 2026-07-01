# ScentPersona 部署指南

本文覆盖从零到生产的完整流程：Web C 端 + 后台、数据库迁移与种子、真实支付/通知接入、微信/小红书小程序发布、实时推送 WS 服务、上线自检与 CI。

> 命名与金额约定：所有金额一律以「分」（整数）存储与传输；密钥只从环境变量读取，禁止入库、禁止写进代码；后台敏感操作全部走审计日志；生产环境后台必须开启鉴权。

---

## 1. 架构总览

| 组件 | 技术 | 部署位置 | 必须 |
|---|---|---|---|
| Web（C 端 + 后台 API/页面） | Next.js 14 App Router | Vercel（或任意 Node 20 平台） | ✅ |
| 数据库 | Neon PostgreSQL | Neon（Serverless） | ✅ |
| 实时支付推送 | SSE（内置） / 裸 WebSocket（`scripts/ws-server.mjs`） | Vercel 自带 SSE；WS 需自托管（Docker） | 可选 |
| 微信小程序 | Taro 4 编译 `weapp` | 微信开发者工具上传 | 可选 |
| 小红书小程序 | 同一 Taro 代码编译 `xhs` | 小红书开发者后台上传 | 可选 |

SSE 在 Serverless（Vercel）即可用；只有在需要多端广播 / 长连接时才部署裸 WS 服务。客户端优先连 `NEXT_PUBLIC_WS_URL`，连不上自动回退 SSE，二选一即可。

---

## 2. 前置条件

- Node.js 20+、npm 10+
- 一个 PostgreSQL 库（推荐 Neon，自带 `DATABASE_URL` 连接池 + `DIRECT_URL` 直连）
- （可选）微信支付商户 v3、支付宝开放平台、小红书支付资质
- （可选）Resend（邮件）、阿里云短信或 Twilio（短信）、微信服务号（模板消息）

---

## 3. 环境变量

复制 `.env.example` 为 `.env`（本地）或在 Vercel 项目设置里逐条填写。按需分组：

### 3.1 必填（最小可跑）

| 变量 | 说明 |
|---|---|
| `DATABASE_URL` | Neon 连接池串（含 `?sslmode=require`） |
| `DIRECT_URL` | Neon 直连串，供 `prisma migrate` 使用 |
| `APP_URL` | 站点公网地址，如 `https://scentpersona.com`（支付回跳/回调、二维码用） |
| `SESSION_SECRET` | C 端用户会话签名密钥（随机 32+ 字节） |
| `ADMIN_SESSION_SECRET` | 后台会话 Cookie 的 HMAC 密钥（随机 32+ 字节） |
| `ADMIN_BOOTSTRAP_EMAIL` | 首个后台 owner 账号邮箱（首次启动引导用） |

未接真实支付时，`DEFAULT_PAYMENT_PROVIDER=mock` + `MOCK_PAY_SECRET=<随机串>` 即可跑通全流程（上线自检会对 mock 给 warning，符合预期）。

### 3.2 支付（接真实时填）

- 微信支付 v3：`WECHAT_APPID` `WECHAT_MCHID` `WECHAT_SERIAL_NO` `WECHAT_PRIVATE_KEY` `WECHAT_APIV3_KEY` `WECHAT_PLATFORM_PUBLIC_KEY` `WECHAT_NOTIFY_URL`
- 支付宝：`ALIPAY_APP_ID` `ALIPAY_PRIVATE_KEY` `ALIPAY_PUBLIC_KEY` `ALIPAY_GATEWAY` `ALIPAY_NOTIFY_URL` `ALIPAY_RETURN_URL`
- 小红书：`XHS_APP_ID` `XHS_APP_SECRET` `XHS_MERCHANT_ID` `XHS_NOTIFY_URL`
- 选择默认：`DEFAULT_PAYMENT_PROVIDER=wechat|alipay|xhs`

> `WECHAT_PRIVATE_KEY` / `ALIPAY_PRIVATE_KEY` 是多行 PEM，在 Vercel 里粘贴时保留换行（或用 `\n` 转义并在代码侧已做还原）。私钥只进环境变量，绝不入库。

### 3.3 通知（接真实时填）

- 邮件（Resend）：`RESEND_API_KEY` `RESEND_FROM`
- 短信（二选一）：阿里云 `ALIYUN_SMS_ACCESS_KEY_ID` `ALIYUN_SMS_ACCESS_KEY_SECRET` `ALIYUN_SMS_SIGN_NAME` `ALIYUN_SMS_TEMPLATE_CODE`；或 Twilio `TWILIO_ACCOUNT_SID` `TWILIO_AUTH_TOKEN` `TWILIO_FROM`
- 微信服务号模板消息：`WECHAT_OA_APPID` `WECHAT_OA_SECRET` `WECHAT_OA_TEMPLATE_ID`

未配置时通知自动降级为「站内消息」，不报错。

### 3.4 电商平台开放接口（报价/比价，选填）

`JD_*` `TAOBAO_*` `TMALL_*` `PDD_*` —— 用于拉取商品报价。缺失时对应平台 offer 走人工/种子数据。
> 合规红线：仅用于价格展示与代下单，绝不保存用户在电商平台的账号密码、绝不代替用户登录、绝不绕过登录/验证码/风控/反爬/限购、绝不自动抢购。

### 3.5 实时 WS（自托管时填）

`WS_PORT` `WS_PUBLISH_SECRET` `WS_PUBLISH_URL`（Web 端向 WS 推送用）、`NEXT_PUBLIC_WS_URL`（浏览器连接用，如 `wss://ws.scentpersona.com`）。

---

## 4. 部署 Web（Vercel + Neon）

1. **建库**：Neon 控制台建项目，复制连接串到 `DATABASE_URL`（pooled）与 `DIRECT_URL`（direct）。
2. **导入仓库**：Vercel New Project → 选本仓库 → Framework 自动识别 Next.js。
3. **填环境变量**：把第 3 节的必填项（及已接入的支付/通知）填入 Vercel。
4. **构建命令**：默认 `next build` 即可。迁移建议放在部署钩子或手动执行（见第 5 节），不要让每次构建自动 `migrate deploy` 以免并发冲突。
5. **Deploy**。

其他 Node 平台（自托管/容器）：`npm ci && npm run build && npm start`，Node 20。

---

## 5. 数据库迁移 + 种子

```bash
# 应用全部迁移（14 个，顺序见下）
npx prisma migrate deploy

# 生成 client（CI/构建里已含；本地首次需要）
npx prisma generate

# 写入初始数据，让上线自检的「法务/可推荐商品/库存」转绿
npx prisma db seed        # 等价 npm run db:seed
```

迁移顺序（`prisma/migrations/`）：
`init` → `add_orders` → `secure_orders` → `order_fulfillment` → `feedback_order_link` → `data_deletion_requests` → `analytics_events` → `catalog_products` → `proxy_orders` → `commercial_infra` → `trust_compliance_risk` → `support_notify_inventory_fulfillment` → `cms_coupons_conversion_wardrobe` → `admin_auth`。

**种子内容（幂等，可反复执行）**：
- 5 份法务协议（代下单授权 / 隐私政策 / 退款政策 / 物流政策 / 服务条款，直接发布生效）
- 3 款可推荐商品、6 个多平台 offer（天猫/京东/拼多多）
- 4 档会员等级（普通/银/金/黑）
- 3 个自营 SKU（含批号、有效期、库存）
- 4 个示例专题落地页（`/c/men-first-fragrance`、`/c/gift-no-mistake`、`/c/bedtime-ritual`、`/c/commute-scent`）
- 5 张示例优惠券（`WELCOME10` 新人立减 ¥10、`SAVE20OVER200` 满 ¥200 减 ¥20、`FREESHIP` 免邮、`SAMPLE5` 小样立减 ¥5、`PROXY15` 代下单 85 折封顶 ¥30）
- 经营主体资料 + 支付手续费成本规则（0.6%，喂给利润核算）

**演示数据（可选，演示经营看板用）**：种子默认只写上面的上线必需数据；要让 `/admin/business-dashboard` 有数据，加环境变量跑一次：

```bash
SEED_DEMO=1 npx prisma db seed     # 或 npm run db:seed:demo
```

会写入 8 个演示用户、24 笔样品/代下单订单（跨状态、跨最近 75 天）、利润快照、40 次测试会话与 60 条商品浏览事件及少量售后/工单/履约记录。幂等（哨兵订单 `DEMO-0001` 存在则跳过），演示数据均标 `DEMO-` / `@scentpersona.example`，生产环境请勿设置 `SEED_DEMO`。

一键重置演示数据（先清空所有演示标记记录再重播，仅影响演示数据）：

```bash
node scripts/reset-demo.mjs          # 预览将删除的数量
npm run reset:demo -- --yes          # 执行删除并重新播种
```

**运营批量维护商品（CSV）**：商品与多平台报价可用 `data/products.csv` 维护（一行一个报价，列表列用 `|`、tags 用 `键:值;`）。编辑后导入：

```bash
node scripts/import-products.mjs --dry   # 先校验解析
npm run import:products                   # 写库：Product 按名匹配、Offer 按 平台+商品ID upsert
```

前台新增 `/c` 专题聚合页（列出所有已发布专题），首页也有"按香型探索 + 精选专题"推荐位，数据均来自数据库种子。每个专题页带 hero 图（种子用 picsum 占位，运营可在后台改 `heroImageUrl`）和"自营/推荐商品聚合位"（按香型从已审核 offer 聚合，自营优先展示）。

---

## 6. 首个后台账号（bootstrap）

首次上线时用 `ADMIN_BOOTSTRAP_EMAIL` 指定的邮箱引导创建 owner 账号（scrypt 存储密码，绝不明文）。之后在后台用户管理里按 RBAC 分配角色：`owner / admin / operator / finance / viewer`。中间件在 Edge 层用 Web Crypto 校验会话 Cookie，`/admin/login` 与 `/api/admin/auth/*` 豁免。

生产务必确认：`ADMIN_SESSION_SECRET` 已设置且足够随机；`/admin/*` 无鉴权时不可访问。

---

## 7. 接真实支付

对每个渠道：填第 3.2 节环境变量 → 在对应商户平台把**回调地址**配成 `APP_URL` + 各自 notify 路径（`WECHAT_NOTIFY_URL` / `ALIPAY_NOTIFY_URL` / `XHS_NOTIFY_URL`）→ 设 `DEFAULT_PAYMENT_PROVIDER`。

Webhook 已做：**验签 + 金额核对 + 幂等**（重复回调只入账一次），并在成功后向 WS/SSE 推送支付事件。上线前用各渠道「沙箱/1 分钱」真实回调验证一次全链路：下单 → 拉起支付 → 回调 → 订单状态机流转 → 前端实时变「已支付」。

- 微信：支持 Native（扫码，`/pay/wechat` 出二维码）、JSAPI（小程序/公众号内）、H5。
- 支付宝：`alipay.trade.page.pay`（RSA2）。
- 小红书：HMAC-SHA256 签名，小程序内拉起。

---

## 8. 接真实通知

填第 3.3 节变量即可自动启用。渠道优先级：站内消息始终写入；邮件/短信/服务号模板消息在配置齐全时叠加发送。模板消息需先在微信服务号后台申请 `WECHAT_OA_TEMPLATE_ID` 并让用户关注公众号 + 完成 openid 绑定。

---

## 9. 小程序发布（微信 + 小红书）

同一套 Taro 代码分别编译两端：

```bash
cd miniapp
npm install
# 微信
npm run build:weapp     # 产物用「微信开发者工具」打开 dist/ 上传
# 小红书
npm run build:xhs       # 产物在小红书开发者后台上传
```

- 在 `miniapp` 的运行配置里把 API 基址指向线上 `APP_URL`（登录态用 token：`Authorization: Bearer` 或 `sp_user` cookie，服务端已兼容）。
- 微信小程序后台需配置合法域名（request/socket）为你的 `APP_URL` / `NEXT_PUBLIC_WS_URL` 域名。
- C 端功能已对齐：账户、气味档案、地址、香水衣橱、优惠券、推荐/邀请、会员、通知、发票、隐私中心、客服会话、售后、小样反馈、内容/法务页、代下单下单与支付（微信/小红书）。

---

## 10. 实时 WS 服务（可选，自托管）

Serverless 上 SSE 已够用。需要长连接/多端广播时再上裸 WS：

```bash
# 本地
npm run ws:server        # 监听 WS_PORT

# Docker
docker build -f Dockerfile.ws -t scentpersona-ws .
docker run -p 8081:8081 --env-file .env scentpersona-ws
# 或
docker compose -f docker-compose.ws.yml up -d
```

然后设 `NEXT_PUBLIC_WS_URL=wss://你的WS域名`、`WS_PUBLISH_URL` + `WS_PUBLISH_SECRET`（Web 端鉴权推送）。反向代理需开启 WebSocket Upgrade。

---

## 11. 上线自检 + 健康检查

- **后台自检页**：`/admin/launch-checklist`。做完第 5 节迁移+种子、配好 `APP_URL` 与两个 session 密钥后，法务 / 可推荐商品 / 库存 / 数据库 / 鉴权应转绿；支付、物流在仍用 mock/人工时显示 warning——这是**预期提示**，接了真实渠道后转绿。
- **健康探针**：`GET /api/health`（DB 连通性等），可挂给平台的健康检查/Uptime 监控。

---

## 12. 持续集成（GitHub Actions）

`.github/workflows/ci.yml` 三个 job：
- **checks**：`prisma generate` → `tsc --noEmit`（当前全项目 0 错误）→ `next lint` → `vitest`（纯逻辑引擎断言）。
- **miniapp**：Taro 端 `tsc` 类型检查。
- **e2e**：起 Postgres service → `migrate deploy` → `build` → Playwright 跑代下单主流程（`tests/e2e/proxy-order.spec.ts`，测试用播种接口受 `E2E_TEST=1` 保护）。
- **csv-validate**（`.github/workflows/csv-validate.yml`）：PR 改动 `data/products.csv` 或 `scripts/import-products.mjs` 时，自动跑 `node scripts/import-products.mjs --dry` 校验解析（无需 DB）。

推送前本地务必 `npm install` 同步 `package-lock.json`（含 `ws` 依赖），否则 CI 的 `npm ci` 会失败。

---

## 13. 安全与合规清单（上线前逐条确认）

- [ ] 不保存用户电商平台账号密码；不代替登录；不绕过登录/验证码/风控/反爬/限购；无自动抢购。
- [ ] 不保存银行卡信息；支付一律走第三方渠道。
- [ ] 手机号/地址默认脱敏展示，仅在必要环节最小化解密。
- [ ] 无医疗/疗效宣称（如「治疗焦虑」「改善失眠」等一律替换为合规表述）。
- [ ] 后台敏感操作全部写审计日志；生产 `/admin/*` 已开启鉴权。
- [ ] 所有密钥仅来自环境变量；`.env` 不入库；金额全部以分为单位。

---

## 14. 常见问题

- **`prisma migrate` 连不上**：确认用的是 `DIRECT_URL`（直连）而非 pooled；Neon 串带 `sslmode=require`。
- **构建时 Prisma client 报模型缺失**：先 `npx prisma generate` 再 build（CI 已含该步）。
- **CI `npm ci` 失败**：本地 `npm install` 后提交更新的 `package-lock.json`。
- **支付回调收不到**：核对商户后台回调地址=`APP_URL`+notify 路径、公网可达、验签密钥正确。
- **小程序 request 被拦**：在小程序后台把线上域名加入合法 request/socket 域名。
- **上线自检支付项是黄的**：正常，`mock` 或未配置真实渠道时的预期 warning，接入后转绿。
