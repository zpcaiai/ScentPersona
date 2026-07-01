import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ── Legal documents (make launch-checklist legal green) ──
const LEGAL: { type: string; title: string; content: string }[] = [
  {
    type: "proxy_order_agreement",
    title: "代下单授权说明",
    content: [
      "1. 本服务是平台根据你的授权，为你采购你所选择的指定商品，并非第三方电商平台的官方订单页面。",
      "2. 报价基于下单时的商品数据，价格、库存与优惠可能随时变化；若采购时价格变化，我们会联系你确认补差价、换品或退款，绝不擅自加价采购。",
      "3. 物流以商家实际发货及承运方信息为准，香水类含醇商品可能受运输规则限制。",
      "4. 采购前可申请取消并退款；已采购或已发货后，需根据平台商家规则处理退换货。",
      "5. 我们不会保存你的电商平台账号密码、不代你登录个人账号、不绕过验证码/风控/限购，也不承诺一定抢到或最低价。",
    ].join("\n"),
  },
  { type: "privacy", title: "隐私政策", content: "我们仅收集为你提供选香、推荐、代下单与售后所必需的信息（如手机号、收货地址）。手机号与地址默认脱敏展示，后台访问敏感信息会记录审计日志。你可随时在「隐私中心」撤回营销授权、导出数据或申请删除账户；订单交易记录将依法保留。" },
  { type: "refund_policy", title: "退款政策", content: "未采购前可申请全额退款；缺货或采购涨价你不接受时可全额退款；已采购/已发货后需根据平台商家规则处理，退款金额不超过实付金额。退款将原路退回。" },
  { type: "shipping_policy", title: "物流政策", content: "物流信息来自承运方，可能存在延迟。香水属含醇商品，部分线路可能限制运输，以实际承运方为准。若长时间无更新，可联系客服核实。" },
  { type: "terms", title: "服务协议", content: "使用本平台即表示你同意本服务协议、隐私政策与代下单授权说明。平台不代买违法违规商品、危险品或医疗用途产品。" },
];

// ── Recommendable products + multi-platform offers ──
const NOW = new Date();
const PRODUCTS: {
  name: string; brand: string; volumeMl: number; scentFamily: string;
  top: string[]; middle: string[]; base: string[]; tags: Record<string, number>; scenes: string[];
  offers: { platform: string; pid: string; priceCents: number; original?: number; shop: string; shopType: string; rating: number; reviews: number; sales: number }[];
}[] = [
  {
    name: "祖玛珑 蓝风铃淡香水", brand: "Jo Malone", volumeMl: 100, scentFamily: "清新花香",
    top: ["蓝风铃", "柠檬"], middle: ["茉莉", "铃兰"], base: ["白麝香", "琥珀"],
    tags: { clean: 8, soft: 6, woody: 3, bright: 7, presence: 4, calm: 5 }, scenes: ["通勤", "约会", "日常"],
    offers: [
      { platform: "tmall", pid: "seed-bluebell-tmall", priceCents: 118000, original: 138000, shop: "祖玛珑官方旗舰店", shopType: "flagship_official", rating: 4.9, reviews: 5200, sales: 3100 },
      { platform: "jd", pid: "seed-bluebell-jd", priceCents: 121000, shop: "京东国际美妆", shopType: "brand_authorized", rating: 4.8, reviews: 2100, sales: 1500 },
      { platform: "pdd", pid: "seed-bluebell-pdd", priceCents: 99000, shop: "香氛折扣店", shopType: "pop", rating: 4.5, reviews: 320, sales: 800 },
    ],
  },
  {
    name: "白茶清晨淡香水", brand: "ScentPersona", volumeMl: 50, scentFamily: "白茶木质",
    top: ["白茶", "柑橘"], middle: ["橙花", "白花"], base: ["白麝香", "雪松"],
    tags: { clean: 9, soft: 7, woody: 4, bright: 5, presence: 3, calm: 7 }, scenes: ["通勤", "独处", "睡前"],
    offers: [
      { platform: "tmall", pid: "seed-baicha-tmall", priceCents: 29900, original: 39900, shop: "ScentPersona 官方旗舰店", shopType: "flagship_official", rating: 4.9, reviews: 1800, sales: 2600 },
      { platform: "taobao", pid: "seed-baicha-taobao", priceCents: 28800, shop: "香遇小铺", shopType: "pop", rating: 4.7, reviews: 640, sales: 900 },
    ],
  },
  {
    name: "深夜木屋淡香精", brand: "ScentPersona", volumeMl: 50, scentFamily: "木质东方",
    top: ["佛手柑"], middle: ["雪松", "广藿香"], base: ["檀香", "琥珀", "香草"],
    tags: { clean: 3, soft: 5, woody: 9, bright: 2, presence: 8, calm: 6 }, scenes: ["重要场合", "约会", "夜晚"],
    offers: [
      { platform: "jd", pid: "seed-muwu-jd", priceCents: 45900, shop: "ScentPersona 京东自营", shopType: "flagship_official", rating: 4.8, reviews: 760, sales: 540 },
    ],
  },
];

const MEMBERSHIP: { name: string; level: number; minSpendCents: number; benefits: string[] }[] = [
  { name: "普通会员", level: 1, minSpendCents: 0, benefits: ["基础推荐"] },
  { name: "银卡会员", level: 2, minSpendCents: 50000, benefits: ["生日礼券", "优先客服"] },
  { name: "金卡会员", level: 3, minSpendCents: 200000, benefits: ["免服务费券", "礼盒折扣", "优先客服"] },
  { name: "黑卡会员", level: 4, minSpendCents: 1000000, benefits: ["专属顾问", "全部权益"] },
];

const SKUS: { skuCode: string; name: string; type: string; volumeMl: number; stock: number; costCents: number; batchNo: string }[] = [
  { skuCode: "SMP-BAICHA-2ML", name: "白茶清晨 小样 2ml", type: "sample", volumeMl: 2, stock: 200, costCents: 800, batchNo: "B2026A" },
  { skuCode: "SMP-MUWU-2ML", name: "深夜木屋 小样 2ml", type: "sample", volumeMl: 2, stock: 150, costCents: 1200, batchNo: "B2026B" },
  { skuCode: "PKG-GIFTBOX", name: "气味人格礼盒包材", type: "packaging", volumeMl: 0, stock: 500, costCents: 500, batchNo: "PKG26" },
];

const CONTENT: { slug: string; title: string; subtitle: string; seoTitle: string; seoDesc: string; blocks: unknown[] }[] = [
  {
    slug: "men-first-fragrance", title: "男生的第一支香水", subtitle: "不用懂香调，回答几个生活问题就好",
    seoTitle: "男生第一支香水怎么选 | ScentPersona", seoDesc: "6 个生活问题，帮你找到第一支不会出错的香水，并对比多平台价格。",
    blocks: [
      { title: "为什么第一支这么难选", text: "香调术语太多、试错成本太高。我们把它变简单：回答 6 个生活问题，直接给方向。" },
      { title: "从这三种开始最稳", items: ["干净通勤：白茶、柑橘、白麝香", "温柔约会：奶香、橙花、香草", "有气场的夜晚：雪松、檀香、琥珀"] },
      { cta: { label: "开始选香测试", href: "/quiz" } },
    ],
  },
  {
    slug: "gift-no-mistake", title: "送礼不踩雷", subtitle: "按对方的样子选，而不是按你自己的",
    seoTitle: "香水送礼怎么选不踩雷 | ScentPersona", seoDesc: "用一个小测试判断对方适合的香味方向，再挑小样礼盒或正装。",
    blocks: [
      { title: "送礼三条原则", items: ["先小样、后正装，降低踩雷风险", "选“干净好闻不挑人”的方向更安全", "附一张气味人格卡，更有心意"] },
      { cta: { label: "帮 TA 做个测试", href: "/quiz" } },
    ],
  },
  {
    slug: "bedtime-ritual", title: "睡前香氛仪式", subtitle: "给疲惫的一天一个安静的结束",
    seoTitle: "睡前香氛怎么选 | ScentPersona", seoDesc: "茶、纸张、乳香、木质——营造放松氛围的睡前香味方向（非助眠功效承诺）。",
    blocks: [
      { title: "让房间先安静下来", text: "睡前的香不需要存在感，需要的是把注意力从白天收回来的安静。茶、纸张、乳香、雪松都是好选择。" },
      { text: "温和配方，使用前建议先做局部测试。" },
      { cta: { label: "找到你的安静香", href: "/quiz" } },
    ],
  },
  {
    slug: "commute-scent", title: "通勤不出错的香", subtitle: "干净、低调、不打扰同事",
    seoTitle: "通勤香水推荐 | ScentPersona", seoDesc: "上班、见客户、第一次约会前，选干净感高、存在感适中的通勤香。",
    blocks: [
      { title: "通勤香的标准", items: ["干净感高、存在感适中", "喷 1-2 下即可，别太多", "白茶/柑橘/白麝香类最稳"] },
      { cta: { label: "看看适合你的通勤香", href: "/quiz" } },
    ],
  },
];

const COUPONS: { code: string; type: string; value: number; scope: string; min?: number; maxDiscount?: number; perUser?: number }[] = [
  { code: "WELCOME10", type: "fixed_amount", value: 1000, scope: "all", perUser: 1 },
  { code: "SAVE20OVER200", type: "fixed_amount", value: 2000, scope: "all", min: 20000 },
  { code: "FREESHIP", type: "free_shipping", value: 0, scope: "all" },
  { code: "SAMPLE5", type: "sample_credit", value: 500, scope: "sample", perUser: 1 },
  { code: "PROXY15", type: "percentage", value: 15, scope: "proxy_order", maxDiscount: 3000 },
];

async function main() {
  // 1) Legal (only if not already active)
  for (const l of LEGAL) {
    const existing = await db.legalDocument.findFirst({ where: { type: l.type, isActive: true } });
    if (!existing) {
      await db.legalDocument.create({ data: { type: l.type, version: "v1", title: l.title, content: l.content, isActive: true, publishedAt: new Date() } });
      console.log(`  legal: published ${l.type}`);
    }
  }

  // 2) Products + offers (idempotent by product name + offer platform/pid)
  for (const p of PRODUCTS) {
    let product = await db.product.findFirst({ where: { normalizedName: p.name } });
    if (!product) {
      product = await db.product.create({
        data: {
          normalizedName: p.name, brand: p.brand, volumeMl: p.volumeMl, category: "fragrance",
          scentFamily: p.scentFamily, gender: "unisex",
          topNotesJson: JSON.stringify(p.top), middleNotesJson: JSON.stringify(p.middle), baseNotesJson: JSON.stringify(p.base),
          scentTagsJson: JSON.stringify(p.tags), suitableScenesJson: JSON.stringify(p.scenes), reviewStatus: "approved",
        },
      });
    }
    for (const o of p.offers) {
      const exists = await db.productOffer.findUnique({ where: { platform_platformProductId: { platform: o.platform, platformProductId: o.pid } } }).catch(() => null);
      if (exists) continue;
      await db.productOffer.create({
        data: {
          productId: product.id, platform: o.platform, platformProductId: o.pid,
          title: `${p.brand} ${p.name} ${p.volumeMl}ml`, brand: p.brand, shopName: o.shop, shopType: o.shopType,
          priceCents: o.priceCents, originalPriceCents: o.original ?? null, currency: "CNY",
          rating: o.rating, reviewCount: o.reviews, salesCount: o.sales,
          imageUrl: "https://images.scentpersona.example/placeholder.jpg", sourceUrl: `https://example.com/${o.pid}`,
          couponInfoJson: "{}", rawDataJson: "{}", riskFlagsJson: "[]", qualityScore: 85,
          reviewStatus: "approved", fetchedAt: NOW, isAvailable: true,
        },
      });
    }
    console.log(`  product: ${p.name} (${p.offers.length} offers)`);
  }

  // 3) Membership tiers (upsert by unique level)
  for (const t of MEMBERSHIP) {
    await db.membershipTier.upsert({
      where: { level: t.level },
      create: { name: t.name, level: t.level, minSpendCents: t.minSpendCents, benefitsJson: JSON.stringify(t.benefits) },
      update: { name: t.name, minSpendCents: t.minSpendCents, benefitsJson: JSON.stringify(t.benefits) },
    });
  }
  console.log(`  membership: ${MEMBERSHIP.length} tiers`);

  // 4) Inventory SKUs (upsert by unique skuCode)
  for (const s of SKUS) {
    await db.inventorySku.upsert({
      where: { skuCode: s.skuCode },
      create: {
        skuCode: s.skuCode, name: s.name, type: s.type, volumeMl: s.volumeMl || null,
        batchNo: s.batchNo, expirationDate: new Date(NOW.getFullYear() + 2, 11, 31),
        stockQuantity: s.stock, reservedQuantity: 0, availableQuantity: s.stock, costCents: s.costCents, status: "active",
      },
      update: {},
    });
  }
  console.log(`  inventory: ${SKUS.length} SKUs`);

  // 5) Business entity (create if none)
  if ((await db.businessEntityProfile.count()) === 0) {
    await db.businessEntityProfile.create({
      data: { legalName: "示例科技（杭州）有限公司", displayName: "ScentPersona", contactEmail: "support@scentpersona.example", serviceScopeJson: JSON.stringify(["选香推荐", "代下单履约", "自营小样"]) },
    });
    console.log("  business entity: created");
  }

  // 6) Payment-fee cost rule (create if none)
  if ((await db.costRule.count({ where: { type: "payment_fee" } })) === 0) {
    await db.costRule.create({ data: { name: "支付手续费", type: "payment_fee", ruleJson: JSON.stringify({ rate: 0.006 }), isActive: true } });
    console.log("  cost rule: payment_fee 0.6%");
  }

  // 7) Content / landing pages (upsert by unique slug)
  for (const c of CONTENT) {
    await db.contentPage.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, title: c.title, subtitle: c.subtitle, pageType: "landing", status: "published", publishedAt: new Date(), contentBlocksJson: JSON.stringify(c.blocks), seoTitle: c.seoTitle, seoDescription: c.seoDesc },
      update: { title: c.title, subtitle: c.subtitle, status: "published", contentBlocksJson: JSON.stringify(c.blocks), seoTitle: c.seoTitle, seoDescription: c.seoDesc },
    });
  }
  console.log(`  content: ${CONTENT.length} landing pages`);

  // 8) Coupons (upsert by unique code)
  for (const c of COUPONS) {
    await db.coupon.upsert({
      where: { code: c.code },
      create: { code: c.code, type: c.type, value: c.value, scope: c.scope, minOrderAmountCents: c.min ?? null, maxDiscountCents: c.maxDiscount ?? null, perUserLimit: c.perUser ?? null, status: "active" },
      update: { type: c.type, value: c.value, scope: c.scope, minOrderAmountCents: c.min ?? null, maxDiscountCents: c.maxDiscount ?? null, perUserLimit: c.perUser ?? null, status: "active" },
    });
  }
  console.log(`  coupons: ${COUPONS.length}`);
}

main()
  .then(() => console.log("✅ seed done"))
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
