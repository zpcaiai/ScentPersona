"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

export default function MockPayPage({ params }: { params: { orderId: string } }) {
  const { locale } = useLang();
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState<{ orderNo?: string; accessToken?: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pay(outcome: "success" | "fail") {
    setLoading(outcome);
    setError(null);
    try {
      const res = await fetch("/api/payments/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: params.orderId, outcome }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || pick(locale, "支付失败", "Payment failed"));
      } else {
        setDone(json);
      }
    } catch {
      setError(pick(locale, "网络错误，请重试", "Network error, please try again"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "48px 20px", fontFamily: "system-ui" }}>
      <div style={{ border: "1px solid #eadfd3", borderRadius: 16, padding: 24, background: "#fffdfa" }}>
        <p style={{ fontSize: 13, color: "#9a948c", margin: 0 }}>{pick(locale, "模拟支付（开发环境）", "Mock payment (dev environment)")}</p>
        <h1 style={{ fontSize: 20, margin: "8px 0 4px" }}>{pick(locale, "ScentPersona 收银台", "ScentPersona Checkout")}</h1>
        <p style={{ color: "#6b6760", fontSize: 14 }}>
          {pick(
            locale,
            "这是用于演示的 Mock 收银台，不会真实扣款。点击下方按钮模拟支付结果。",
            "This is a demo checkout — no real charge is made. Tap a button below to simulate the payment result."
          )}
        </p>

        {done ? (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontWeight: 600 }}>
              {done.status === "paid"
                ? pick(locale, "✅ 支付成功", "✅ Payment successful")
                : done.status === "failed"
                ? pick(locale, "支付未成功", "Payment didn't go through")
                : pick(locale, `结果：${done.status}`, `Result: ${done.status}`)}
            </p>
            {done.orderNo && (
              <a
                href={`/orders/${done.orderNo}${done.accessToken ? `?token=${done.accessToken}` : ""}`}
                style={{ display: "inline-block", marginTop: 8, color: "#7c9070", fontWeight: 600 }}
              >
                {pick(locale, "查看我的订单 →", "View my order →")}
              </a>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button
              onClick={() => pay("success")}
              disabled={loading !== null}
              style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "#7c9070", color: "#fff", fontWeight: 600 }}
            >
              {loading === "success" ? pick(locale, "处理中…", "Processing…") : pick(locale, "模拟支付成功", "Simulate success")}
            </button>
            <button
              onClick={() => pay("fail")}
              disabled={loading !== null}
              style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#6b6760" }}
            >
              {pick(locale, "模拟失败", "Simulate failure")}
            </button>
          </div>
        )}
        {error && <p style={{ color: "#c0392b", marginTop: 12, fontSize: 14 }}>{error}</p>}
      </div>
    </main>
  );
}
