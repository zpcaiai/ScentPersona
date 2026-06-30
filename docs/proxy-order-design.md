# 代下单（Proxy-Order）业务设计 · Skill 22

> 用户选商品 → 系统生成报价 → 用户支付 → 后台人工/合规接口采购 → 录入平台订单号 → 更新运单 → 用户查看物流 → 支持退款/售后。

本模块**合并进现有订单系统**：与“小样套装”订单共用一张 `orders` 表，用 `orderType` 区分（`sample_kit` | `proxy`），代下单专用字段与 `Order*` 子表挂在同一订单主键上。

## 合规边界（硬约束）
**不做**：保存用户电商平台账号密码、代登录、绕过验证码/风控/限购/反爬、自动抢购、承诺最低价/一定有货、保存银行卡号、把实时价格伪装成固定价。
**只做**：用户授权下的代采购履约、第三方托管支付、后台人工录单、运单同步、订单透明、退款/补差价/取消。

## 状态机（`src/lib/orders/orderStatus.ts`）
```
draft → quoted → awaiting_payment → paid → purchasing → purchased → awaiting_shipment → shipped → delivered
                                              ├→ price_changed → purchasing
                                              └→ out_of_stock → purchasing
任意可取消态 → cancelled
已支付后(paid/purchasing/purchased/price_changed/out_of_stock/awaiting_shipment/shipped/after_sales) → refund_pending → refunded
任意非终态 → failed（人工兜底）
shipped/delivered → after_sales
```
- 唯一改状态入口：`transitionOrderStatus()`，校验合法性、打时间戳、写 `OrderEvent`（含 operatorId/reason）。非法转换抛错。
- 终态：`cancelled` / `refunded` / `failed`。
- 单元测试：`tests/orders/orderStatus.test.ts`（16 条断言全绿）。

## 数据表（`prisma/schema.prisma` + migration `20260109000000_proxy_orders`）
- `orders`（扩展）：`orderType` + 商品快照(sourcePlatform/sourceOfferId/sourceProductUrl/productTitle/...) + 金额明细(productPriceCents/serviceFeeCents/domesticShippingFeeCents/estimatedTotalCents/finalTotalCents) + 报价(quoteExpiresAt/priceSnapshotJson/riskFlagsJson)。
- `order_addresses`：结构化收货地址（为字段级加密预留 `encryptedRawAddress`）。
- `order_payments`：支付记录（provider/providerPaymentId/status/amountCents/refundedAmountCents/purpose）。
- `order_purchases`：后台采购记录（platformOrderNo/purchaseCostCents/截图）。**采购成本不展示给用户。**
- `order_shipments`：运单（carrier/trackingNo/status/轨迹）。
- `order_refunds`：退款（status/amountCents/providerRefundId）。
- `order_price_adjustments`：补差价（old/new/diff/expiresAt/status）。
- `order_events`：全链路审计时间线。

## API
**用户**：`POST /api/proxy-orders/quote`、`/[id]/confirm`、`/[id]/pay`、`/[id]/refund-request`、`/[id]/price-adjustment/accept|reject`、`GET /api/proxy-orders/detail`、`GET /[id]/payment-status`。
**支付**：`POST /api/payments/webhook/[provider]`（验签+幂等+金额校验）、`POST /api/payments/mock`（演示 PSP 回调）。
**后台**（`/api/admin/*`，受 Basic-Auth 中间件保护）：`/[id]/purchase/start|complete|out-of-stock`、`/[id]/shipment`、`/[id]/shipment/sync`、`/[id]/refund/approve|reject`、`/[id]/price-adjustment`。

## 页面
- Web 用户：`/proxy-order/[orderId]/confirm`（确认+协议+支付）、`/orders/[orderNo]`（订单中心：进度/物流/补差价/退款）、`/pay/mock/[orderId]`（演示收银台）。
- Web 后台：`/admin/proxy-orders`（工作台列表）、`/admin/proxy-orders/[orderId]`（详情+采购/物流/退款/补差价操作+时间线）。
- 入口：商品比价页 `帮我代下单` 按钮（`ProxyOrderButton`）。
- 小程序（微信+小红书同一 Taro 代码）：`proxy-search`（多平台比价）→ `proxy-confirm` → `proxy-order`（跟踪）。

## 关键异常场景
- **报价过期**：confirm/pay 校验 `quoteExpiresAt`，过期 410，需重新报价。
- **异常低价**：`suspicious_low_price` 的 offer 不直接报价（停留 draft，需人工）。
- **采购涨价**：后台建补差价 → `price_changed` → 用户支付差价(继续)或拒绝(退款)。
- **缺货**：`out_of_stock` → 用户换品(继续)或退款。
- **支付金额不一致**：webhook 标记 `manual_review`，不转 paid。
- **物流异常/查询失败**：不影响订单主流程，仅记录事件。

## 支付/物流 provider
抽象层 + 注册表；MVP 用 `mock`（演示，绝不真实扣款）与人工录单。生产替换为 Stripe/微信/支付宝、快递100/快递鸟（骨架已留，密钥仅从 env 读）。
