# ScentPersona 商业闭环 · 完善与 UI 优化审计

面向：把“推荐 + 代下单 + 支付 + 物流”升级为可真实上线运营的系统。

## 1. 现状（本轮已交付）
- **选香 + 推荐 + 多平台比价**：已存在（Skills 0–21 基本完成）。
- **代下单全链路（Skills 22–37）已落地**：状态机、报价、确认、第三方托管支付抽象（mock + Stripe/微信/支付宝骨架）、幂等验签 webhook、后台采购工作台、运单录入/同步、退款、补差价、隐私脱敏、订单审计时间线。
- **三端打通**：Web（用户/收银台/后台）+ 微信小程序 + 小红书小程序（同一 Taro 代码，`proxy-search → proxy-confirm → proxy-order`）。
- **合规边界内建**：不存平台账密、不代登录、不绕风控、不保存银行卡、不承诺最低价/必达。

## 2. 上线前必须补齐的工程项（阻断级）
1. **数据库迁移**：`npx prisma migrate deploy`（或 `prisma db push`）应用 `20260109000000_proxy_orders`；`prisma generate` 重新生成类型（Vercel 构建已含）。本沙箱无法联网下载 Prisma 引擎，故未在此执行——这是预期内的一步。
2. **真实支付**：把 `DEFAULT_PAYMENT_PROVIDER` 从 `mock` 切到 Stripe Checkout / 微信 / 支付宝，实现 `createCheckoutSession / verifyWebhook / refund`。**移除 `/api/payments/mock` 与 `/pay/mock` 演示入口。**
3. **小程序原生支付**：当前小程序用 mock 支付演示；上线接 `Taro.requestPayment`（微信）/ `xhs.requestPayment`（小红书），复用已有 `miniapp/src/lib/pay.ts` 思路，服务端补 proxy 订单的下单签名接口。
4. **后台真实鉴权**：现为 Basic-Auth 中间件 + `getAdminOperator` 占位。上线接入 `AdminUser` + 角色权限（见 Skill 41），所有 `/admin/*` 与敏感读取写 `DataAccessLog`。
5. **香水运输合规**：含醇液体快递限制，需在承运/线路层面校验并在下单页明示（文案已留）。

## 3. UI 调整与优化建议
**Web**
- 比价页：把 `帮我代下单` 与 `去平台看看` 做成主/次按钮对，并标注“代下单=本站履约，非平台官方订单”；展示数据新鲜度徽章（fresh/stale/expired）。
- 确认页：金额明细加“服务费如何计算”说明；地址表单加省/市/区联动选择器（当前为纯输入）。
- 订单中心：状态用步骤条（报价→支付→采购→发货→签收）替代纯文字；补差价/缺货用醒目卡片 + 倒计时（报价/差价有效期）。
- 收银台：当前为内联演示样式，替换为真实 PSP 托管页。
**小程序**
- 首页/“我的”增加“我的代下单”入口（当前仅商品详情进入）；`orders` 列表应聚合 `sample_kit` 与 `proxy` 两类订单。
- `proxy-confirm` 协议改用 `Checkbox`/`Switch` 组件并链接完整协议页；地址用 `picker` 省市区。
- 价格/状态用骨架屏与 `Taro.showLoading`，弱网下减少空白。
- 微信/小红书主题已按 `THEME_CLASS` 区分（绿/红），保持品牌一致。
**通用**
- 全站金额统一“分→元”展示，内部仍用 cents（已遵循）。
- 手机号/地址默认脱敏（已实现），仅订单详情/后台完整页展示并审计。

## 4. 完整商业闭环差距 → Skills 38–55 路线图（待实现）
按依赖与优先级分批，均挂在现有 `orders`/`order_events` 主干上：

| 批次 | 模块 | 关键表 | 价值 |
|---|---|---|---|
| 商业基建 (38–41) | 用户账户/气味资产、订单利润核算、经营主体/协议/发票、隐私权限/数据审计 | User/UserProfile/UserAddress/UserScentProfile、OrderProfitSnapshot/CostRule、LegalDocument/InvoiceRequest、PrivacyConsent/DataAccessLog/AdminUser | 能算账、沉淀用户、合规可审计 |
| 信任风控 (42–45) | 商品可信度、化妆品合规、售后证据防欺诈、异常风控 | ProductOfferTrustScore、CosmeticComplianceCheck、AfterSalesCase/Evidence、RiskRule/RiskAssessment | 用户敢买、平台可长运营 |
| 履约客服 (46–49) | 客服工单、通知系统、自营小样库存、拣货打包发货 | SupportTicket、Notification、InventorySku/StockMovement、FulfillmentOrder/PackingSlip | 运营效率与信任 |
| 增长复购 (50–53) | 内容 CMS/专题页、优惠券/邀请/会员、试香→正装转化、复购/香味衣橱 | ContentPage/Campaign、Coupon/Referral/Membership、SampleFeedbackFlow、ScentWardrobe | 获客与长期收入 |
| 经营上线 (54–55) | 经营数据看板、上线检查/健康检查 | (聚合查询) + `/api/health` | 老板视角 + 上线风险 |

**建议落地顺序**：38 → 39 → 41 → 40 → 42/43/45 → 46/47 → 48/49 → 52/53 → 50/51 → 54/55。
（每批独立 PR，不破坏现有选香/推荐/代下单/支付/物流；金额 cents；敏感信息脱敏；后台敏感操作审计；MVP 可不做完整 auth 但留 TODO。）

## 5. 上线前检查清单（精简版，完整版见 Skill 55）
- [ ] DATABASE_URL/DIRECT_URL/APP_URL 已配置；迁移已 deploy；`prisma generate` 通过。
- [ ] 支付 provider 切真实、webhook 验签开启、金额校验开启、退款可用；移除 mock 入口。
- [ ] 协议/隐私/退款/物流/代下单授权页已发布（Skill 40）。
- [ ] 商品功效文案过合规检查（无医疗/助眠/绝对化用词）。
- [ ] 手机号/地址脱敏开启；后台敏感访问审计开启；删除请求可记录。
- [ ] 至少有可推荐商品与高可信 offer；异常低价已审核。
- [ ] 状态机/支付/退款单测通过；后台采购/运单/退款流程演练通过。

---

## 实施进度更新

- ✅ **代下单全链路（Skills 22–37）** + 三端（Web/微信/小红书）+ 后台工作台。
- ✅ **商业基建（Skills 38/39/41）**：用户账户与气味资产、订单利润核算（含亏损/成本不完整预警）、隐私权限与数据访问审计。
- ✅ **Skill 40**：经营主体/协议版本管理/订单协议快照/发票申请与开具；公开 `/legal/[slug]`。
- ✅ **信任风控（Skills 42–45）**：商品可信度评分（首推门槛）、化妆品合规审核（含功效违规词检测）、售后证据 + 防欺诈风险分、异常订单/用户/退款风控（高风险订单支付前拦截，后台放行）。
  - 纯逻辑引擎均带可执行断言校验：trust 11/11、claim、after-sales、order-risk 全绿。
  - 风控接入点：confirm 写协议快照并评估风险；pay 命中 blocked 标记则 403；售后通过可一键发起退款。

- ✅ **Batch 3（Skills 46–49）**：客服工单（用户/后台留言式 + 常用回复 + 关单）、通知系统（站内 + 邮件/短信/微信 provider 抽象，订单关键节点自动发：支付/采购/价格变化/缺货/发货/签收/退款；营销类可关闭，订单必要类不可关）、自营小样库存（SKU + 批号/有效期 + 流水 + **防超卖预占/释放/出库**）、拣货打包发货（履约单 → 逐件拣货 → 打包单脱敏 → 发货并扣库存 + 回写订单物流）。
  - 纯逻辑校验：通知模板渲染、库存 available/status 计算断言全绿。
  - 部署新增第 4 个迁移：`20260112_support_notify_inventory_fulfillment`。

- ✅ **Batch 4（Skills 50–53）**：内容 CMS / 专题页（数据库驱动，公开 `/c/[slug]` + SEO 元信息 + 内容块；后台创建/发布）、优惠券（4 类型 + 校验引擎 + 后台创建 + 校验 API）、邀请（邀请码 + 防自邀/防重复 + 奖励）、会员（等级/累计消费/进度）、**试香→正装转化**（反馈写入气味档案 + 喜欢即生成正装推荐与小样抵扣券）、复购与**香味衣橱**（场景缺位建议 + 补货提醒模型）。
  - 纯逻辑校验：优惠券校验 8 例、衣橱场景建议 2 例全绿。
  - 接入点：签收→自动建试香反馈流并发提醒；反馈"喜欢"→生成 sample_credit 券。
  - 部署新增第 5 个迁移：`20260113_cms_coupons_conversion_wardrobe`。

**仍待推进**：（客服工单/通知/库存/拣货发货 · Skills 46–49）、Batch 4（CMS/优惠券会员/试香转化/复购衣橱 · Skills 50–53）、Batch 5（经营看板/上线检查 · Skills 54–55）。

**部署提醒**：现有 3 个迁移需依次 `prisma migrate deploy` + `prisma generate`：`20260109_proxy_orders` → `20260110_commercial_infra` → `20260111_trust_compliance_risk` → `20260112_support_notify_inventory_fulfillment` → `20260113_cms_coupons_conversion_wardrobe` → `20260114_admin_auth`。

- ✅ **微信小程序/H5 真实下单 + 二维码 + 真实通知 provider**：
  - 微信 v3 **JSAPI**（小程序：openid→prepay_id→`buildJsapiParams` 返回 `Taro.requestPayment` 参数）与 **H5**（移动网页 h5_url）；统一路由 `POST /api/proxy-orders/[id]/pay/wechat`（mode jsapi|h5|native，复用报价过期/地址/风控校验）。
  - 小程序 `proxy-confirm` 已接：weapp 环境走真实微信 JSAPI（`resolveOpenid`→requestPayment），未配置时回退演示 mock；用户取消支付不会误触发 mock。
  - `/pay/wechat/[orderId]` 用 qrcodejs 渲染 code_url 为真实二维码，并轮询 `/api/payments/wechat-status` 支付成功自动提示。
  - 通知真实 provider：邮件 **Resend**、短信 **阿里云**（RPC HMAC-SHA1 签名，模板制）/ **Twilio**（国际，自由文本），`sendNotification` 自动解析收件人（user.email/phone），无收件人则标记 failed 不影响主流程。
  - 支付加密原语经实测：RSA2 签验、微信 v3 请求签名、AES-256-GCM 解密 5/5；JSAPI 复用同一 RSA-SHA256 签名。
- ✅ **小红书小程序真实支付 + 微信服务号模板消息**：
  - 小红书：`xhsPaymentProvider`（HMAC-SHA256 签名、回调验签、退款）接入支付 provider 注册表；`POST /api/proxy-orders/[id]/pay/xhs` 返回 `xhs.requestPayment` 参数；小程序 `proxy-confirm` 在 XHS 环境走真实支付（`xhs.requestPayment`，回退 `Taro.requestPayment`），未配置回退演示 mock。
  - 微信服务号：`wechatTemplateProvider`（access_token 内存缓存 + 模板消息发送）接入通知 wechat 渠道；收件人用 OA openid（经通知 `data.openid` 传入）。
  - 至此支付覆盖：Web 扫码(微信 Native)/支付宝跳转 + 微信小程序 JSAPI + 微信 H5 + 小红书小程序；通知覆盖：站内/邮件(Resend)/短信(阿里云+Twilio)/微信服务号模板。
- ✅ **小程序 C 端与 Web 对齐**：token 鉴权（`/api/account/*` 支持 Bearer，登录返回 token，小程序自动携带）；新增 16 个小程序页面（账户中心/气味资产/地址簿/衣橱/券/邀请/会员/通知/发票/隐私/客服+会话/售后/试香反馈/专题/法务），tabBar「我的」改为账户中心，proxy-order 增加售后与试香反馈入口；新增 `/api/content/[slug]`、`/api/legal/[slug]`。微信/小红书双端同一套 Taro 代码。
- ✅ **看板图表 + 支付实时推送 + E2E**：经营看板接入 Chart.js（转化漏斗/订单类型/利润/履约/商品互动 5 图，CDN 加载）；`/pay/wechat` 由客户端轮询改为 **SSE 服务端推送**（`/api/payments/wechat-events`，单连接 EventSource，支付成功即推送；注：Vercel 无常驻进程不支持裸 WebSocket，SSE 为该栈的正确推送方式，跨实例可再接 Redis/Pusher）；新增 Playwright E2E `tests/e2e/proxy-order.spec.ts` 覆盖代下单 API 全链路（报价→确认→支付→幂等→采购→发货→签收）+ 确认页 UI 冒烟 + 协议未勾选异常，配 `/api/test/seed-offer`（`E2E_TEST=1` 才启用）。
- ✅ **裸 WebSocket（自托管）+ CI**：独立 `scripts/ws-server.mjs`（`ws`，`/internal/publish` 共享密钥广播 + `/health`），webhook 经 `publishPaymentEvent` 在支付成功/失败时发布；`WechatQR` 配置 `NEXT_PUBLIC_WS_URL` 时优先走 WebSocket、失败自动回退 SSE（Vercel 无 WS 时用 SSE，自托管 Node 用 WS）。GitHub Actions `.github/workflows/ci.yml`：checks 任务（prisma generate → typecheck → vitest）+ e2e 任务（postgres service → migrate deploy → build → Playwright chromium 跑代下单 E2E，含报告产物）。
- ✅ **Prisma seed + 全量类型检查通过**：`prisma/seed.ts`（幂等）种子——5 份法务协议（发布生效）、3 款可推荐商品共 6 个多平台 offer、4 档会员等级、3 个自营 SKU（含批号/有效期/库存）、经营主体、支付手续费 CostRule；配 `package.json` 的 `prisma.seed`，`npx prisma db seed` 或 `npm run db:seed` 即可，让 `/admin/launch-checklist` 的法务/可推荐商品/库存三项转绿。生成完整 Prisma client 后**全项目 `tsc --noEmit` 0 错误**（并修掉随之暴露的 2 处真实类型问题）。

- ✅ **种子扩充 + 部署文档**：seed 增补 4 个示例专题落地页（`/c/*`）与 5 张示例优惠券（新人/满减/免邮/小样立减/代下单折扣，按 code 幂等 upsert）；新增 `docs/DEPLOYMENT.md` 覆盖 Vercel+Neon、迁移/种子、真实支付与通知接入、微信/小红书小程序发布、裸 WS 自托管、上线自检、CI、安全合规清单，并在 README 挂链。
- ✅ **首页专题推荐位 + /c 聚合页 + 演示数据 + 商品 CSV**：首页新增 DB 驱动的"按香型探索 + 精选专题"模块，新增 `/c` 专题聚合页；seed 增加 `SEED_DEMO` 门控的演示用户/订单/利润快照/漏斗数据填充经营看板（幂等，`DEMO-` 前缀）；商品与多平台报价抽成 `data/products.csv` + `scripts/import-products.mjs`（--dry 校验，平台+商品ID upsert）供运营批量维护，配 `db:seed:demo` / `import:products` 脚本。
- ✅ **专题 hero + 商品聚合位 / 演示一键重置 / CSV 校验 CI**：专题页新增 hero 图（种子 picsum 占位）与"自营/推荐商品聚合位"（`TopicProducts` 按香型聚合已审核 offer，自营优先）；`scripts/reset-demo.mjs`（`reset:demo`，--yes 执行）清空所有演示标记记录后重播 `SEED_DEMO`；新增 `.github/workflows/csv-validate.yml`，PR 改 `data/products.csv` 或导入脚本自动跑 `--dry` 校验。

- ✅ **聚合位显式选品 + Hero 对象存储上传 + 看板一键重置**：专题商品聚合块支持 family / productNames / offerIds 三种指定（自营优先）；新增 S3 兼容 SigV4 预签名上传（无依赖 `src/lib/storage/s3.ts` + `/api/admin/uploads/presign` 受 product:edit 保护 + `ImageUpload` 集成进内容页），密钥不落前端；演示数据抽成共享模块 `src/lib/dev/demoData.ts`（seed / reset 脚本 / 后台按钮共用），新增 `/api/admin/demo/reset`（admin:manage + ENABLE_DEMO_TOOLS 双门控）与看板「重置演示数据」按钮。
- ✅ **上传校验/缩略图 + 可视化选品器 + 预签名限流**：上传前端校验格式/大小(MAX_UPLOAD_BYTES)/尺寸并自动生成缩略图(`.thumb` 约定，列表页 `deriveThumbUrl` 消费)；改用预签名 POST 的 content-length-range 在存储端强制大小上限；预签名接口按操作员 20 次/分限流(`src/lib/rate-limit.ts`)；内容页新增 `ProductBlockBuilder` 可视化生成商品聚合块(配 `/api/admin/products/options`)，免手写 JSON。
- ✅ **heroThumbUrl 正式字段 + 内容块拖拽排序 + 跨实例限流**：`ContentPage.heroThumbUrl` 列 + 迁移 `20260115000000_content_hero_thumb`（前端上传落库、列表页优先读该列并回退 `.thumb` 约定；边界用类型转换桥接，本地 `prisma generate` 后生效）；`BlockListEditor` HTML5 拖拽排序/上下移/删除整段内容块；`rate-limit.ts` 升级为 Upstash Redis(REST) 跨实例限流，未配置/不可达自动降级进程内内存限流（无 Redis 也能用）。
