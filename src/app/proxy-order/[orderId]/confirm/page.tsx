"use client";

/* eslint-disable @next/next/no-img-element */
import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";
import { getProxyCopy } from "@/data/proxyOrderCopy";

const yuan = (c?: number | null) => (c == null ? "—" : `¥${(c / 100).toFixed(2)}`);

interface Detail {
  status: string;
  product: { title?: string; imageUrl?: string; brand?: string; spec?: string; quantity?: number; sourcePlatform?: string };
  breakdown: { productPriceCents?: number; serviceFeeCents?: number; domesticShippingFeeCents?: number; estimatedTotalCents?: number; currency?: string };
  quoteExpiresAt?: string | null;
  riskFlags: string[];
}

function ConfirmInner() {
  const { locale } = useLang();
  const proxy = getProxyCopy(locale);
  const params = useParams<{ orderId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const orderId = params.orderId;
  const token = search.get("token") ?? "";

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [agree, setAgree] = useState(false);
  const [form, setForm] = useState({
    recipientName: "", phone: "", province: "", city: "", district: "",
    addressLine1: "", addressLine2: "", postalCode: "",
  });

  useEffect(() => {
    fetch(`/api/proxy-orders/detail?id=${orderId}&token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setDetail(d);
      })
      .catch(() => setError(pick(locale, "加载失败", "Failed to load")))
      .finally(() => setLoading(false));
  }, [orderId, token, locale]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      const c = await fetch(`/api/proxy-orders/${orderId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, agreementAccepted: agree }),
      });
      const cj = await c.json();
      if (!c.ok) {
        setError(cj.error || pick(locale, "确认失败", "Confirmation failed"));
        return;
      }
      const p = await fetch(`/api/proxy-orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "mock" }),
      });
      const pj = await p.json();
      if (!p.ok || !pj.checkoutUrl) {
        setError(pj.error || pick(locale, "发起支付失败", "Couldn't start payment"));
        return;
      }
      window.location.href = pj.checkoutUrl;
    } catch {
      setError(pick(locale, "网络错误", "Network error"));
    } finally {
      setSubmitting(false);
    }
  }, [orderId, form, agree, locale]);

  if (loading) return <p className="text-sage-600">{pick(locale, "加载中…", "Loading…")}</p>;
  if (error && !detail) return <p className="text-red-600">{pick(locale, "无法加载订单：", "Couldn't load this order: ")}{error}</p>;
  if (!detail) return null;

  const b = detail.breakdown;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-clay-600">{proxy.serviceName} · {pick(locale, "确认订单", "Confirm order")}</p>
        <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "确认商品与收货信息", "Confirm item and shipping details")}</h1>
      </div>

      <section className="rounded-2xl border border-cream-200 bg-cream-50 p-4">
        <div className="flex gap-3">
          {detail.product.imageUrl && (
            <img src={detail.product.imageUrl} alt="" className="h-20 w-20 rounded-lg object-cover" />
          )}
          <div className="flex-1">
            <p className="text-xs text-clay-500">{detail.product.sourcePlatform}</p>
            <p className="font-medium leading-snug">{detail.product.title}</p>
            <p className="text-sm text-sage-600">
              {detail.product.brand} {detail.product.spec} · ×{detail.product.quantity}
            </p>
          </div>
        </div>
        <dl className="mt-4 space-y-1 border-t border-cream-200 pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-sage-600">{pick(locale, "商品价", "Item price")}</dt><dd>{yuan(b.productPriceCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-sage-600">{pick(locale, "代下单服务费", "Proxy order service fee")}</dt><dd>{yuan(b.serviceFeeCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-sage-600">{pick(locale, "预估国内运费", "Estimated domestic shipping")}</dt><dd>{yuan(b.domesticShippingFeeCents)}</dd></div>
          <div className="flex justify-between border-t border-cream-200 pt-2 font-semibold">
            <dt>{pick(locale, "合计", "Total")}</dt><dd className="text-clay-600">{yuan(b.estimatedTotalCents)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-clay-300 bg-clay-50/40 p-4 text-sm text-clay-600">
        <p className="font-medium">{pick(locale, "下单前请了解：", "Before you order, please note:")}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {proxy.riskNotices.map((n) => <li key={n}>{n}</li>)}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-sage-600">{pick(locale, "收货信息", "Shipping details")}</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className="input-base col-span-1 rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "收件人", "Recipient")} value={form.recipientName} onChange={set("recipientName")} />
          <input className="col-span-1 rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "手机号", "Phone number")} value={form.phone} onChange={set("phone")} />
          <input className="rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "省", "Province")} value={form.province} onChange={set("province")} />
          <input className="rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "市", "City")} value={form.city} onChange={set("city")} />
          <input className="rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "区/县", "District")} value={form.district} onChange={set("district")} />
          <input className="rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "邮编(可选)", "Postal code (optional)")} value={form.postalCode} onChange={set("postalCode")} />
          <input className="col-span-2 rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "详细地址", "Street address")} value={form.addressLine1} onChange={set("addressLine1")} />
        </div>
      </section>

      <label className="flex items-start gap-2 text-sm text-sage-600">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
        <span>{proxy.agreementShort}</span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={submit}
        disabled={submitting || !agree}
        className="w-full rounded-xl bg-sage-500 py-3 font-medium text-white disabled:opacity-50"
      >
        {submitting ? pick(locale, "处理中…", "Processing…") : pick(locale, "确认并去支付", "Confirm and pay")}
      </button>
      <p className="text-center text-xs text-clay-500">{pick(locale, "本服务为本站代下单履约，并非第三方电商平台官方订单。", "This service is us ordering on your behalf, not an official order on a third-party e-commerce platform.")}</p>
    </div>
  );
}

export default function ProxyConfirmPage() {
  return (
    <PageShell>
      <Suspense fallback={<ConfirmFallback />}>
        <ConfirmInner />
      </Suspense>
    </PageShell>
  );
}

function ConfirmFallback() {
  const { locale } = useLang();
  return <p className="text-sage-600">{pick(locale, "加载中…", "Loading…")}</p>;
}
