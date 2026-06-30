import { db } from "@/lib/db";
import CouponManager from "@/components/admin/CouponManager";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";
export const dynamic = "force-dynamic";
export default async function AdminCouponsPage() {
  const locale = getLocale();
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "优惠券", "Coupons")}</h1>
      <p className="text-sm text-clay-500">{pick(locale, "优惠成本计入利润核算；退款时按策略回滚。", "Discount costs flow into finance; refunds roll back per policy.")}</p>
      <div className="mt-4"><CouponManager coupons={coupons.map((c: { id: string; code: string; type: string; value: number; status: string; usedCount: number }) => ({ id: c.id, code: c.code, type: c.type, value: c.value, status: c.status, usedCount: c.usedCount }))} /></div>
    </main>
  );
}
