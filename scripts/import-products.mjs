#!/usr/bin/env node
/**
 * 批量导入/更新可推荐商品与多平台报价（运营维护用）。
 *
 * 用法：
 *   node scripts/import-products.mjs [csvPath] [--dry]
 *   默认 csvPath = data/products.csv
 *   --dry 只解析并打印摘要，不写数据库（无需 DATABASE_URL）
 *
 * 幂等：Product 按 normalizedName 匹配（有则更新、无则新建）；
 *       ProductOffer 按 (platform, platform_product_id) upsert。
 * CSV：UTF-8，列表列用 | 分隔，tags 用 "键:值;键:值"。支持 Excel 的双引号转义。
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const csvPath = resolve(args.find((a) => !a.startsWith("--")) ?? "data/products.csv");

// --- minimal RFC4180 CSV parser (handles quoted fields with commas/quotes/newlines) ---
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  const s = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // strip BOM
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ""));
}

const rows = parseCsv(readFileSync(csvPath, "utf8"));
const header = rows.shift().map((h) => h.trim());
const idx = (name) => header.indexOf(name);
const need = ["product_name","brand","volume_ml","scent_family","gender","top_notes","middle_notes","base_notes","tags","scenes","platform","platform_product_id","price_cents","original_price_cents","shop_name","shop_type","rating","review_count","sales_count"];
const missing = need.filter((n) => idx(n) < 0);
if (missing.length) { console.error("CSV 缺少列:", missing.join(", ")); process.exit(1); }

const list = (v) => (v ? v.split("|").map((x) => x.trim()).filter(Boolean) : []);
const tagsObj = (v) => Object.fromEntries(list(v.replaceAll(";", "|")).map((kv) => { const [k, n] = kv.split(":"); return [k.trim(), Number(n)]; }).filter(([k, n]) => k && !Number.isNaN(n)));

// group offer rows by product
const products = new Map();
for (const r of rows) {
  const g = (n) => (r[idx(n)] ?? "").trim();
  const name = g("product_name");
  if (!name) continue;
  if (!products.has(name)) {
    products.set(name, {
      name, brand: g("brand"), volumeMl: Number(g("volume_ml")) || 0, scentFamily: g("scent_family"),
      gender: g("gender") || "unisex", top: list(g("top_notes")), middle: list(g("middle_notes")),
      base: list(g("base_notes")), tags: tagsObj(g("tags")), scenes: list(g("scenes")), offers: [],
    });
  }
  products.get(name).offers.push({
    platform: g("platform"), pid: g("platform_product_id"),
    priceCents: Number(g("price_cents")) || 0,
    original: g("original_price_cents") ? Number(g("original_price_cents")) : null,
    shop: g("shop_name"), shopType: g("shop_type") || "pop",
    rating: Number(g("rating")) || 0, reviews: Number(g("review_count")) || 0, sales: Number(g("sales_count")) || 0,
  });
}

const offerCount = [...products.values()].reduce((a, p) => a + p.offers.length, 0);
console.log(`解析：${products.size} 个商品 / ${offerCount} 个报价（来自 ${csvPath}）`);
for (const p of products.values()) console.log(`  · ${p.name} [${p.scentFamily}/${p.gender}] × ${p.offers.length} offer`);

if (dry) { console.log("--dry：仅校验，未写库。"); process.exit(0); }

// --- write to DB ---
const { PrismaClient } = await import("@prisma/client");
const db = new PrismaClient();
const NOW = new Date();
let created = 0, updatedP = 0, upsertedO = 0;
try {
  for (const p of products.values()) {
    let product = await db.product.findFirst({ where: { normalizedName: p.name } });
    const data = {
      normalizedName: p.name, brand: p.brand, volumeMl: p.volumeMl, category: "fragrance",
      scentFamily: p.scentFamily, gender: p.gender,
      topNotesJson: JSON.stringify(p.top), middleNotesJson: JSON.stringify(p.middle), baseNotesJson: JSON.stringify(p.base),
      scentTagsJson: JSON.stringify(p.tags), suitableScenesJson: JSON.stringify(p.scenes), reviewStatus: "approved",
    };
    if (!product) { product = await db.product.create({ data }); created++; }
    else { await db.product.update({ where: { id: product.id }, data }); updatedP++; }

    for (const o of p.offers) {
      const offerData = {
        title: `${p.brand} ${p.name} ${p.volumeMl}ml`, brand: p.brand, shopName: o.shop, shopType: o.shopType,
        priceCents: o.priceCents, originalPriceCents: o.original, currency: "CNY",
        rating: o.rating, reviewCount: o.reviews, salesCount: o.sales,
        reviewStatus: "approved", fetchedAt: NOW, isAvailable: true,
      };
      await db.productOffer.upsert({
        where: { platform_platformProductId: { platform: o.platform, platformProductId: o.pid } },
        create: {
          productId: product.id, platform: o.platform, platformProductId: o.pid, ...offerData,
          imageUrl: "https://images.scentpersona.example/placeholder.jpg", sourceUrl: `https://example.com/${o.pid}`,
          couponInfoJson: "{}", rawDataJson: "{}", riskFlagsJson: "[]", qualityScore: 85,
        },
        update: { productId: product.id, ...offerData },
      });
      upsertedO++;
    }
  }
  console.log(`✅ 导入完成：新建商品 ${created}，更新商品 ${updatedP}，写入报价 ${upsertedO}`);
} catch (e) { console.error(e); process.exit(1); }
finally { await db.$disconnect(); }
