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
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/payments/wechat-status?orderId=${encodeURIComponent(orderId)}`);
        const j = await r.json();
        if (j.paid) { setPaid(true); clearInterval(t); }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(t);
  }, [orderId]);

  if (paid) return <p style={{ color: "#556648", fontWeight: 600, marginTop: 16 }}>{pick(locale, "✅ 支付成功，订单已更新", "✅ Payment successful, order updated")}</p>;
  return <div ref={ref} style={{ display: "inline-block", marginTop: 16 }} />;
}
