"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

export default function ProxyOrderAdminActions({
  orderId,
  status,
  hasPendingRefund,
}: {
  orderId: string;
  status: string;
  hasPendingRefund: boolean;
}) {
  const router = useRouter();
  const { locale } = useLang();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function call(path: string, body?: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/admin/proxy-orders/${orderId}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const j = await r.json();
      setMsg(r.ok ? `✅ ${pick(locale, "已处理", "Done")}` : `❌ ${j.error || pick(locale, "失败", "Failed")}`);
      if (r.ok) router.refresh();
    } catch {
      setMsg(`❌ ${pick(locale, "网络错误", "Network error")}`);
    } finally {
      setBusy(false);
    }
  }

  const btn = "rounded-lg bg-sage-500 px-3 py-1.5 text-sm text-white disabled:opacity-50";
  const ghost = "rounded-lg border border-clay-300 px-3 py-1.5 text-sm text-clay-600 disabled:opacity-50";

  return (
    <div className="mt-4 rounded-xl border border-cream-200 bg-cream-50 p-3">
      <div className="flex flex-wrap gap-2">
        {status === "paid" && (
          <button disabled={busy} className={btn} onClick={() => call("purchase/start")}>{pick(locale, "开始采购", "Start purchasing")}</button>
        )}
        {status === "purchasing" && (
          <>
            <button disabled={busy} className={btn} onClick={() => {
              const platformOrderNo = window.prompt(pick(locale, "平台订单号", "Platform order no."));
              if (!platformOrderNo) return;
              const cost = window.prompt(pick(locale, "采购成本（元，可空）", "Purchase cost (¥, optional)")) || "";
              call("purchase/complete", {
                platformOrderNo,
                purchaseCostCents: cost ? Math.round(parseFloat(cost) * 100) : undefined,
              });
            }}>{pick(locale, "完成采购", "Complete purchase")}</button>
            <button disabled={busy} className={ghost} onClick={() => {
              const newPrice = window.prompt(pick(locale, "新的商品总价（元）", "New product total (¥)"));
              const reason = window.prompt(pick(locale, "原因", "Reason")) || pick(locale, "采购时价格变化", "Price changed during purchase");
              if (newPrice) call("price-adjustment", { newProductPriceCents: Math.round(parseFloat(newPrice) * 100), reason });
            }}>{pick(locale, "价格变化", "Price changed")}</button>
            <button disabled={busy} className={ghost} onClick={() => call("purchase/out-of-stock", { reason: window.prompt(pick(locale, "缺货说明", "Out-of-stock note")) || pick(locale, "缺货", "Out of stock") })}>{pick(locale, "标记缺货", "Mark out of stock")}</button>
          </>
        )}
        {status === "awaiting_shipment" && (
          <button disabled={busy} className={btn} onClick={() => {
            const carrierName = window.prompt(pick(locale, "承运商，如 顺丰", "Carrier, e.g. SF Express"));
            const trackingNo = window.prompt(pick(locale, "运单号", "Tracking no."));
            if (carrierName && trackingNo) call("shipment", { carrierName, trackingNo });
          }}>{pick(locale, "录入运单并发货", "Add tracking & ship")}</button>
        )}
        {(status === "shipped") && (
          <button disabled={busy} className={ghost} onClick={() => call("shipment/sync", { provider: "mock" })}>{pick(locale, "同步物流", "Sync tracking")}</button>
        )}
        {hasPendingRefund && (
          <>
            <button disabled={busy} className={btn} onClick={() => call("refund/approve")}>{pick(locale, "批准退款", "Approve refund")}</button>
            <button disabled={busy} className={ghost} onClick={() => call("refund/reject", { reason: window.prompt(pick(locale, "拒绝原因", "Rejection reason")) || pick(locale, "不符合条件", "Not eligible") })}>{pick(locale, "拒绝退款", "Reject refund")}</button>
          </>
        )}
      </div>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </div>
  );
}
