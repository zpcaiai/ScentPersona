"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";
export default function InventoryAdjust({ skuId }: { skuId: string }) {
  const router = useRouter();
  const { locale } = useLang();
  const [movement, setMovement] = useState("inbound");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setMsg(null);
    const r = await fetch(`/api/admin/inventory/${skuId}/movement`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ movement, quantity: Number(quantity), reason }) });
    const j = await r.json(); setBusy(false); setMsg(r.ok ? `✅ ${pick(locale, "已记录", "Recorded")}` : `❌ ${j.error}`);
    if (r.ok) { setQuantity(""); setReason(""); router.refresh(); }
  }
  return (
    <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-cream-200 bg-cream-50 p-3 text-sm">
      <select className="rounded border border-cream-300 px-2 py-1.5" value={movement} onChange={(e) => setMovement(e.target.value)}>
        <option value="inbound">{pick(locale, "入库 +", "Stock in +")}</option><option value="adjust">{pick(locale, "调整 ±", "Adjust ±")}</option><option value="damaged">{pick(locale, "损耗 -", "Damaged -")}</option><option value="expired">{pick(locale, "过期 -", "Expired -")}</option>
      </select>
      <input className="w-24 rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "数量", "Qty")} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      <input className="flex-1 rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "原因", "Reason")} value={reason} onChange={(e) => setReason(e.target.value)} />
      <button disabled={busy} onClick={submit} className="rounded-lg bg-sage-500 px-3 py-1.5 text-white">{pick(locale, "记录", "Record")}</button>
      {msg && <span>{msg}</span>}
    </div>
  );
}
