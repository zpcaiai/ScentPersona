"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";
export default function FulfillmentActions({ id, items, status }: { id: string; items: { id: string; skuName: string; status: string; quantity: number }[]; status: string }) {
  const router = useRouter();
  const { locale } = useLang();
  const [busy, setBusy] = useState(false);
  async function call(path: string, body?: Record<string, unknown>) {
    setBusy(true);
    const r = await fetch(`/api/admin/fulfillment/${id}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
    if (!r.ok) { const j = await r.json(); alert(j.error); }
    setBusy(false); router.refresh();
  }
  const allPicked = items.every((i) => i.status !== "pending");
  return (
    <div className="mt-3 space-y-2">
      {items.map((i) => (
        <div key={i.id} className="flex items-center justify-between rounded-lg border border-cream-200 px-3 py-2 text-sm">
          <span>{i.skuName} ×{i.quantity} · <span className="text-clay-500">{i.status}</span></span>
          {i.status === "pending" && (
            <span className="space-x-2">
              <button disabled={busy} onClick={() => call("pick", { itemId: i.id })} className="text-sage-600 underline">{pick(locale, "拣货", "Pick")}</button>
              <button disabled={busy} onClick={() => call("pick", { itemId: i.id, missing: true })} className="text-clay-500 underline">{pick(locale, "缺货", "Out of stock")}</button>
            </span>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        {status !== "packed" && status !== "shipped" && <button disabled={busy || !allPicked} onClick={() => call("pack")} className="rounded-lg bg-sage-500 px-3 py-1.5 text-sm text-white disabled:opacity-50">{pick(locale, "打包并生成打包单", "Pack & create slip")}</button>}
        {status === "packed" && <button disabled={busy} onClick={() => { const carrierName = prompt(pick(locale, "承运商", "Carrier")); const trackingNo = prompt(pick(locale, "运单号", "Tracking number")); if (carrierName && trackingNo) call("ship", { carrierName, trackingNo }); }} className="rounded-lg bg-sage-500 px-3 py-1.5 text-sm text-white">{pick(locale, "发货", "Ship")}</button>}
      </div>
    </div>
  );
}
