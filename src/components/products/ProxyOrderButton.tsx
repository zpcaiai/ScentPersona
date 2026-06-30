"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

/**
 * Entry point for the proxy-order (代下单) flow. Generates a quote from an
 * offer, then routes the user to the confirm page. Suspicious-low-price offers
 * come back `blocked` (manual review required) instead of a payable quote.
 */
export default function ProxyOrderButton({
  offerId,
  quantity = 1,
}: {
  offerId: string;
  quantity?: number;
}) {
  const { locale } = useLang();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setErr(null);
    try {
      const sessionId =
        typeof window !== "undefined"
          ? window.localStorage.getItem("sp_session_id") || undefined
          : undefined;
      const r = await fetch("/api/proxy-orders/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, quantity, sessionId }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error || pick(locale, "暂不可代下单", "Proxy order unavailable right now"));
        return;
      }
      if (j.blocked) {
        setErr(
          pick(
            locale,
            "该商品价格异常，需人工确认后才能代下单",
            "This price looks off — we need a manual review before placing a proxy order"
          )
        );
        return;
      }
      try {
        window.localStorage.setItem(`proxyToken:${j.orderNo}`, j.accessToken);
      } catch {
        /* ignore storage */
      }
      window.location.href = `/proxy-order/${j.orderId}/confirm?token=${encodeURIComponent(j.accessToken)}`;
    } catch {
      setErr(pick(locale, "网络错误，请重试", "Network error, please try again"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2">
      <button onClick={start} disabled={busy} className="btn-secondary inline-flex">
        {busy
          ? pick(locale, "生成报价中…", "Getting a quote…")
          : pick(locale, "帮我代下单", "Order this for me")}
      </button>
      {err && <p className="mt-1 text-xs text-clay-600">{err}</p>}
    </div>
  );
}
