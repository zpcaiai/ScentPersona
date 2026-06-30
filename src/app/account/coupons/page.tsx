"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

export default function CouponsPage() {
  const { locale } = useLang();
  const [recs, setRecs] = useState<{ id: string; productId: string; reason: string; coupon: { code: string; type: string; value: number } | null }[]>([]);
  const [auth, setAuth] = useState(true);
  useEffect(() => { fetch("/api/account/coupons").then((r) => { if (r.status === 401) { setAuth(false); return null; } return r.json(); }).then((j) => j && setRecs(j.recommendations)); }, []);
  if (!auth) return <PageShell><p className="text-sage-600">{pick(locale, "请先 ", "Please ")}<Link href="/account" className="underline">{pick(locale, "登录", "sign in")}</Link>{pick(locale, "。", " first.")}</p></PageShell>;
  return (
    <PageShell>
      <div className="space-y-4">
        <Link href="/account" className="text-sm text-sage-600 underline">{pick(locale, "← 我的", "← My account")}</Link>
        <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "我的券 / 正装推荐", "My coupons / full-bottle picks")}</h1>
        {recs.length === 0 && <p className="text-sm text-clay-500">{pick(locale, "暂无推荐。试香后喜欢的香会在这里出现正装抵扣券。", "No picks yet. After your scent trial, full-bottle credit coupons for the ones you love will show up here.")}</p>}
        {recs.map((r) => (
          <div key={r.id} className="rounded-xl border border-cream-200 p-3 text-sm">
            <p className="text-sage-700">{r.reason}</p>
            {r.coupon && <p className="mt-1 text-clay-600">{pick(locale, "抵扣券 ", "Credit coupon ")}<span className="font-mono">{r.coupon.code}</span> · {r.coupon.type === "sample_credit" ? pick(locale, `可抵 ¥${(r.coupon.value / 100).toFixed(2)}`, `Worth ¥${(r.coupon.value / 100).toFixed(2)}`) : r.coupon.type}</p>}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
