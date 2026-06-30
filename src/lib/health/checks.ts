import { db } from "@/lib/db";
import { listConfiguredProviders, DEFAULT_PAYMENT_PROVIDER } from "@/lib/payments";
import { getShippingProvider, DEFAULT_SHIPPING_PROVIDER } from "@/lib/shipping";
import { getActiveDocument } from "@/lib/legal/getActiveDocument";

export type HealthStatus = "ok" | "warning" | "critical";
export interface HealthCheck { key: string; label: string; status: HealthStatus; detail: string; fix?: string }

/** Production launch readiness (Skill 55). Any `critical` blocks go-live. */
export async function runHealthChecks(): Promise<{ status: HealthStatus; checks: HealthCheck[] }> {
  const checks: HealthCheck[] = [];
  const prod = process.env.NODE_ENV === "production";

  try {
    await db.$queryRaw`SELECT 1`;
    checks.push({ key: "database", label: "数据库", status: "ok", detail: "连接正常" });
  } catch {
    checks.push({ key: "database", label: "数据库", status: "critical", detail: "无法连接", fix: "检查 DATABASE_URL / DIRECT_URL，并已 prisma migrate deploy" });
  }

  checks.push(process.env.APP_URL
    ? { key: "app_url", label: "APP_URL", status: "ok", detail: process.env.APP_URL }
    : { key: "app_url", label: "APP_URL", status: "warning", detail: "未配置", fix: "设置 APP_URL（支付成功/取消跳转用）" });

  if (DEFAULT_PAYMENT_PROVIDER === "mock") {
    checks.push({ key: "payment", label: "支付", status: "warning", detail: "当前为 mock 演示支付（不真实扣款）", fix: "上线前切换 DEFAULT_PAYMENT_PROVIDER 并移除 /api/payments/mock" });
  } else {
    const p = listConfiguredProviders().find((x) => x.name === DEFAULT_PAYMENT_PROVIDER);
    checks.push(p?.configured
      ? { key: "payment", label: "支付", status: "ok", detail: DEFAULT_PAYMENT_PROVIDER }
      : { key: "payment", label: "支付", status: "critical", detail: `${DEFAULT_PAYMENT_PROVIDER} 未配置密钥`, fix: "配置对应支付密钥（env）" });
  }

  const sp = getShippingProvider(DEFAULT_SHIPPING_PROVIDER);
  checks.push(sp?.isConfigured()
    ? { key: "shipping", label: "物流", status: DEFAULT_SHIPPING_PROVIDER === "manual" ? "warning" : "ok", detail: DEFAULT_SHIPPING_PROVIDER === "manual" ? "人工录入（可上线）" : DEFAULT_SHIPPING_PROVIDER }
    : { key: "shipping", label: "物流", status: "warning", detail: "未配置物流查询", fix: "接入快递100/快递鸟，或用人工录入" });

  checks.push({ key: "notifications", label: "通知", status: "ok", detail: "站内通知可用（邮件/短信为 mock）" });

  try {
    const want: [string, string][] = [["proxy_order_agreement", "代下单授权"], ["privacy", "隐私政策"], ["refund_policy", "退款政策"]];
    const missing: string[] = [];
    for (const [t, l] of want) if (!(await getActiveDocument(t))) missing.push(l);
    checks.push(missing.length
      ? { key: "legal", label: "法务文档", status: "warning", detail: `未发布：${missing.join("、")}`, fix: "在 /admin/legal 发布生效版本" }
      : { key: "legal", label: "法务文档", status: "ok", detail: "必要协议已发布" });
  } catch { /* db down already flagged */ }

  try {
    const offers = await db.productOffer.count({ where: { reviewStatus: { not: "rejected" }, isAvailable: true } });
    checks.push(offers > 0
      ? { key: "products", label: "可推荐商品", status: "ok", detail: `${offers} 个 offer` }
      : { key: "products", label: "可推荐商品", status: "warning", detail: "无可推荐商品", fix: "导入商品 / 审核 offer" });
  } catch { /* */ }

  try {
    const skus = await db.inventorySku.count({ where: { availableQuantity: { gt: 0 } } });
    checks.push(skus > 0
      ? { key: "inventory", label: "自营库存", status: "ok", detail: `${skus} 个可用 SKU` }
      : { key: "inventory", label: "自营库存", status: "warning", detail: "无可用小样库存", fix: "在 /admin/inventory 入库（自营小样可选）" });
  } catch { /* */ }

  checks.push(process.env.ADMIN_PASSWORD
    ? { key: "admin_auth", label: "后台鉴权", status: "ok", detail: "已设置 Basic Auth（建议升级 AdminUser 权限）" }
    : { key: "admin_auth", label: "后台鉴权", status: prod ? "critical" : "warning", detail: "未设置 ADMIN_PASSWORD", fix: "设置 ADMIN_PASSWORD（生产必须）" });

  checks.push(process.env.SESSION_SECRET
    ? { key: "session", label: "会话密钥", status: "ok", detail: "已设置" }
    : { key: "session", label: "会话密钥", status: prod ? "critical" : "warning", detail: "未设置 SESSION_SECRET", fix: "设置强随机 SESSION_SECRET" });

  const status: HealthStatus = checks.some((c) => c.status === "critical")
    ? "critical" : checks.some((c) => c.status === "warning") ? "warning" : "ok";
  return { status, checks };
}
