import Link from "next/link";
import { getAdminSession } from "@/lib/admin/session";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";
import LogoutButton from "./LogoutButton";

export default function AdminNav() {
  const session = getAdminSession();
  const locale = getLocale();
  const LINKS: [string, string][] = [
    ["/admin/proxy-orders", pick(locale, "代下单工作台", "Proxy orders")], ["/admin/fulfillment", pick(locale, "自营履约", "Fulfillment")], ["/admin/inventory", pick(locale, "库存", "Inventory")],
    ["/admin/finance", pick(locale, "利润核算", "Finance")], ["/admin/business-dashboard", pick(locale, "经营看板", "Dashboard")], ["/admin/after-sales", pick(locale, "售后", "After-sales")],
    ["/admin/support", pick(locale, "客服工单", "Support")], ["/admin/risk", pick(locale, "风控", "Risk")], ["/admin/compliance/products", pick(locale, "商品合规", "Compliance")],
    ["/admin/offers", pick(locale, "商品报价", "Offers")], ["/admin/content", pick(locale, "内容/专题", "Content")], ["/admin/legal", pick(locale, "协议/政策", "Legal")],
    ["/admin/coupons", pick(locale, "优惠券", "Coupons")], ["/admin/launch-checklist", pick(locale, "上线检查", "Launch checklist")],
  ];
  return (
    <nav className="mb-5 rounded-2xl border border-cream-200 bg-white/70 p-3 text-sm">
      <div className="flex flex-wrap gap-2">
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-full border border-cream-200 px-3 py-1 text-stone-600 hover:border-sage-400">{label}</Link>
        ))}
        {session?.role === "owner" && <Link href="/admin/users" className="rounded-full border border-cream-200 px-3 py-1 text-stone-600 hover:border-sage-400">{pick(locale, "管理员", "Admins")}</Link>}
      </div>
      <div className="mt-2 flex items-center justify-end gap-2 text-xs text-clay-500">
        <span>{pick(locale, "角色：", "Role: ")}{session?.role ?? "—"}</span>
        <LogoutButton />
      </div>
    </nav>
  );
}
