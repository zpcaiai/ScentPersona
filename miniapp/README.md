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
