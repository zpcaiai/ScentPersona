# ScentPersona 小程序 (微信 + 小红书)

基于 Taro 4 + React 的一套代码，编译出微信小程序和小红书小程序两套可部署代码。

## 技术栈

- **框架**: Taro 4 (React)
- **语言**: TypeScript
- **样式**: SCSS (rpx 单位)
- **后端**: 调用已部署的 Vercel API

## 目录结构

```
miniapp/
├── config/              # Taro 编译配置
│   ├── index.ts         # 主配置
│   ├── dev.ts           # 开发环境
│   └── prod.ts          # 生产环境
├── src/
│   ├── app.tsx          # 应用入口
│   ├── app.config.ts    # 全局配置（页面路由、窗口样式）
│   ├── app.scss         # 全局样式
│   ├── data/            # 领域数据（与 Web 版同步）
│   │   ├── scentTags.ts
│   │   ├── products.ts
│   │   ├── personas.ts
│   │   ├── quizQuestions.ts
│   │   └── copy.ts
│   ├── lib/
│   │   ├── scoring/     # 评分引擎（与 Web 版同步）
│   │   ├── request.ts   # API 请求封装
│   │   └── utils.ts     # 工具函数
│   └── pages/
│       ├── index/        # 落地页
│       ├── quiz/         # 测验页
│       ├── result/       # 结果页
│       ├── products/     # 产品列表
│       ├── product-detail/  # 产品详情
│       ├── checkout/     # 结账页（下单+支付）
│       ├── orders/       # 订单列表
│       ├── order-detail/ # 订单详情
│       └── feedback/     # 反馈页
├── package.json
├── tsconfig.json
├── babel.config.js
└── project.config.json  # 微信开发者工具配置
```

## 开发

```bash
cd miniapp
npm install

# 微信小程序开发
npm run dev:weapp

# 小红书小程序开发
npm run dev:xhs
```

## 构建

```bash
# 构建微信小程序
npm run build:weapp

# 构建小红书小程序
npm run build:xhs
```

## 部署

### 微信小程序

1. 构建后用微信开发者工具打开 `miniapp/dist` 目录
2. 在微信公众平台后台 → 开发 → 开发设置 → 服务器域名中添加 Vercel API 域名到 request 合法域名
3. 配置微信支付：在微信支付商户平台获取以下信息，设置到 Vercel 环境变量
   - `WECHAT_APPID` — 小程序 AppID
   - `WECHAT_MCHID` — 商户号
   - `WECHAT_SERIAL_NO` — 商户证书序列号
   - `WECHAT_PRIVATE_KEY` — 商户私钥 (PEM 格式)
   - `WECHAT_APIV3_KEY` — APIv3 密钥
   - `WECHAT_NOTIFY_URL` — 支付回调地址 (如 `https://your-project.vercel.app/api/payment/wechat/notify`)
4. 上传代码并提交审核

### 小红书小程序

1. 构建后用小红书开发者工具打开 `miniapp/dist` 目录
2. 在小红书开放平台后台配置 request 合法域名
3. 配置小红书支付：在小红书开放平台获取以下信息，设置到 Vercel 环境变量
   - `XHS_APP_ID` — 小红书 App ID
   - `XHS_APP_SECRET` — 小红书 App Secret
   - `XHS_MERCHANT_ID` — 商户号
   - `XHS_NOTIFY_URL` — 支付回调地址 (如 `https://your-project.vercel.app/api/payment/xhs/notify`)
4. 上传代码并提交审核

## API 配置

在 `src/lib/request.ts` 中修改 `API_BASE` 为你的 Vercel 部署地址：

```ts
const API_BASE = "https://your-project.vercel.app";
```

或在 `config/dev.ts` / `config/prod.ts` 中配置 `API_BASE` 环境变量。

## 页面说明

| 页面 | 路径 | 说明 |
|------|------|------|
| 落地页 | /pages/index/index | Hero + 问题说明 + 流程 + 人格预览 + CTA |
| 测验页 | /pages/quiz/index | 10题逐步选择，本地评分 + API 提交 |
| 结果页 | /pages/result/index | 人格报告 + 标签 + 推荐小样 + 分享 |
| 产品列表 | /pages/products/index | 小样套装 + 全部产品 |
| 产品详情 | /pages/product-detail/index | 香调结构 + 标签 + 适合场景 |
| 结账页 | /pages/checkout/index | 创建订单 + 拉起微信/小红书支付 |
| 订单列表 | /pages/orders/index | 按手机号查询订单 |
| 订单详情 | /pages/order-detail/index | 订单状态 + 商品 + 待支付可重新支付 |
| 反馈页 | /pages/feedback/index | 试香反馈表单 |

## 支付实现说明（重要）

支付逻辑已统一抽取到 `src/lib/pay.ts`：

- **微信小程序**：`payWechatOrder` 走标准 JSAPI 流程（`Taro.login` 换取 openid → 服务端下单 → `Taro.requestPayment`）。
- **小红书小程序**：`payXhsOrder` 优先调用平台原生 `xhs.requestPayment`，在不支持时回退到 `Taro.requestPayment`。
  - ⚠️ 小红书的「交易/支付」客户端 API 字段与服务端下单接口（`src/lib/xhs-pay.ts` 中的 `createXhsOrder` 及其 endpoint/签名方式）**需以小红书开放平台官方文档为准核对**，并在小红书开放平台开通支付资质。
  - 服务端密钥通过 Vercel 环境变量配置：`XHS_APP_ID` / `XHS_APP_SECRET` / `XHS_MERCHANT_ID` / `XHS_NOTIFY_URL`（见根目录 `.env.example`）。
  - 未配置密钥时，下单/支付接口会返回错误，客户端会提示「小红书支付失败」，不影响其他功能联调。

> 注意：本仓库的支付为「按规范结构化 + 占位密钥」实现。上线前必须：(1) 填入真实商户密钥；(2) 用官方开发者工具在真机/沙箱联调；(3) 核对小红书支付客户端 API 的确切字段。

## 发货订阅消息（可选）

微信端在支付成功后会尝试调用 `requestSubscribeMessage`，模板 ID 通过编译环境变量 `SHIP_SUBSCRIBE_TEMPLATE_ID` 注入（见 `config/dev.ts` / `config/prod.ts`）。未配置时自动跳过，不影响支付。

## 本次功能补全（小程序）

- **底部 tabBar 导航**：首页 / 产品 / 订单 / 我的（文字版，微信与小红书均兼容；进入 tab 页统一用 `switchTab`）。
- **「我的」页面**（`pages/profile`）：绑定手机号（用于订单查询与结账自动填写）、入口聚合（订单 / 重新测试 / 全部产品 / 反馈 / 隐私政策）。
- **隐私政策页**（`pages/privacy`）：满足微信/小红书过审要求；主体「ScentPersona 团队」，联系邮箱 zpchoney@gmail.com；结账页同意条款可点击跳转。
- **分享**：结果页 / 落地页 / 产品详情页接入 `useShareAppMessage` + `useShareTimeline`，自定义标题、路径与封面图。
- **订单手机号查询**：订单页支持输入手机号同步全设备订单，并与本机订单合并去重；订单页/详情页支持下拉刷新。
- **产品配图**：6 支香水 + 套装/礼盒统一风格配图，已接入列表、详情、结果推荐、结账、订单详情（图片托管在 Web 端 `public/products/`，小程序通过 `assetUrl()` 以网络图加载）。
- **支付**：统一抽取到 `src/lib/pay.ts`，修正小红书支付调用（不再误用微信 `signType:"RSA"`，优先平台原生 `xhs.requestPayment`）。

> 配图为离线生成的品牌占位图，位于 `public/products/*.jpg`，可随时替换为实拍图（文件名与 slug 一致即可）。
