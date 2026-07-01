"use client";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

/** Renders a WeChat Native code_url as a QR (qrcodejs from CDN) + polls for payment. */
export default function WechatQR({ text, orderId }: { text: string; orderId: string }) {
  const { locale } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!text) return;
    const render = () => {
      const QR = (window as unknown as { QRCode?: new (el: HTMLElement, opts: Record<string, unknown>) => void }).QRCode;
      if (QR && ref.current) {
        ref.current.innerHTML = "";
        new QR(ref.current, { text, width: 220, height: 220 });
      }
    };
    if ((window as unknown as { QRCode?: unknown }).QRCode) render();
    else {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      s.onload = render;
      document.body.appendChild(s);
    }
  }, [text]);

  useEffect(() => {
    if (!orderId) return;
    let cleanup = () => {};
    let settled = false;
    const markPaid = () => { if (!settled) { settled = true; setPaid(true); } cleanup(); };

    const startSse = () => {
      if (typeof EventSource === "undefined") return;
      const es = new EventSource(`/api/payments/wechat-events?orderId=${encodeURIComponent(orderId)}`);
      es.addEventListener("paid", markPaid);
      es.addEventListener("timeout", () => es.close());
      es.addEventListener("failed", () => es.close());
      cleanup = () => es.close();
    };

    // Prefer a real WebSocket when a self-hosted WS endpoint is configured;
    // fall back to SSE (serverless) on any connection error.
    const wsBase = process.env.NEXT_PUBLIC_WS_URL;
    if (wsBase && typeof WebSocket !== "undefined") {
      let opened = false;
      let ws: WebSocket;
      try {
        ws = new WebSocket(`${wsBase.replace(/\/$/, "")}/?orderId=${encodeURIComponent(orderId)}`);
      } catch { startSse(); return () => cleanup(); }
      ws.onopen = () => { opened = true; };
      ws.onmessage = (ev) => { try { const m = JSON.parse(ev.data); if (m.event === "paid") markPaid(); else if (m.event === "failed") ws.close(); } catch { /* ignore */ } };
      ws.onerror = () => { if (!opened && !settled) { try { ws.close(); } catch { /* */ } startSse(); } };
      cleanup = () => { try { ws.close(); } catch { /* */ } };
      return () => cleanup();
    }
    startSse();
    return () => cleanup();
  }, [orderId]);

  if (paid) return <p style={{ color: "#556648", fontWeight: 600, marginTop: 16 }}>{pick(locale, "✅ 支付成功，订单已更新", "✅ Payment successful, order updated")}</p>;
  return <div ref={ref} style={{ display: "inline-block", marginTop: 16 }} />;
}
