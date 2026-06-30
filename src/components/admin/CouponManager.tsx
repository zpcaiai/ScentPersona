"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";
export default function CouponManager({ coupons }: { coupons: { id: string; code: string; type: string; value: number; status: string; usedCount: number }[] }) {
  const router = useRouter();
  const { locale } = useLang();
  const [f, setF] = useState({ code: "", type: "fixed_amount", value: "", scope: "all", minOrderAmountCents: "", perUserLimit: "" });
  const [msg, setMsg] = useState<string | null>(null);
  async function create() {
    const body: Record<string, unknown> = { code: f.code, type: f.type, value: Number(f.value), scope: f.scope };
    if (f.minOrderAmountCents) body.minOrderAmountCents = Number(f.minOrderAmountCents);
    if (f.perUserLimit) body.perUserLimit = Number(f.perUserLimit);
    const r = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json(); setMsg(r.ok ? pick(locale, "已创建", "Created") : j.error); if (r.ok) { setF({ ...f, code: "", value: "" }); router.refresh(); }
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-cream-200 bg-cream-50 p-4 text-sm">
        <input className="rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "券码", "Coupon code")} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
        <select className="rounded border border-cream-300 px-2 py-1.5" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
          <option value="fixed_amount">{pick(locale, "固定减(分)", "Fixed amount (cents)")}</option><option value="percentage">{pick(locale, "折扣(%)", "Percentage (%)")}</option><option value="free_shipping">{pick(locale, "免邮", "Free shipping")}</option><option value="sample_credit">{pick(locale, "小样抵扣(分)", "Sample credit (cents)")}</option>
        </select>
        <input className="rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "面值(分或%)", "Amount (cents or %)")} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
        <select className="rounded border border-cream-300 px-2 py-1.5" value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })}>
          <option value="all">{pick(locale, "全部", "All")}</option><option value="sample">{pick(locale, "小样", "Sample")}</option><option value="proxy_order">{pick(locale, "代下单", "Proxy order")}</option><option value="full_size">{pick(locale, "正装", "Full size")}</option><option value="gift_box">{pick(locale, "礼盒", "Gift box")}</option>
        </select>
        <input className="rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "门槛(分,可空)", "Min spend (cents, optional)")} value={f.minOrderAmountCents} onChange={(e) => setF({ ...f, minOrderAmountCents: e.target.value })} />
        <input className="rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "每人限(可空)", "Per-user limit (optional)")} value={f.perUserLimit} onChange={(e) => setF({ ...f, perUserLimit: e.target.value })} />
        <button onClick={create} className="col-span-2 rounded-lg bg-sage-500 py-2 text-white">{pick(locale, "创建券", "Create coupon")}</button>
        {msg && <p className="col-span-2 text-clay-600">{msg}</p>}
      </div>
      <ul className="space-y-1 text-sm">
        {coupons.map((c) => (
          <li key={c.id} className="flex justify-between border-b border-cream-200 py-1">
            <span className="font-mono">{c.code}</span><span className="text-clay-500">{c.type} · {c.value} · {pick(locale, "用", "used")} {c.usedCount} · {c.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
