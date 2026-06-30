"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

export default function MembershipPage() {
  const { locale } = useLang();
  const [d, setD] = useState<{ points: number; totalSpendCents: number; currentTier: { name: string; level: number } | null; nextTier: { name: string; minSpendCents: number } | null } | null>(null);
  const [auth, setAuth] = useState(true);
  useEffect(() => { fetch("/api/account/membership").then((r) => { if (r.status === 401) { setAuth(false); return null; } return r.json(); }).then((j) => j && setD(j)); }, []);
  if (!auth) return <PageShell><p className="text-sage-600">{pick(locale, "请先 ", "Please ")}<Link href="/account" className="underline">{pick(locale, "登录", "sign in")}</Link>{pick(locale, "。", " first.")}</p></PageShell>;
  if (!d) return <PageShell><p className="text-sage-600">{pick(locale, "加载中…", "Loading…")}</p></PageShell>;
  const pct = d.nextTier ? Math.min(100, (d.totalSpendCents / d.nextTier.minSpendCents) * 100) : 100;
  return (
    <PageShell>
      <div className="space-y-5">
        <Link href="/account" className="text-sm text-sage-600 underline">{pick(locale, "← 我的", "← My account")}</Link>
        <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "会员", "Membership")}</h1>
        <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4">
          <p className="font-serif text-xl text-clay-600">{d.currentTier?.name ?? pick(locale, "普通会员", "Standard member")}</p>
          <p className="text-sm text-sage-600">{pick(locale, "累计消费 ¥", "Total spent ¥")}{(d.totalSpendCents / 100).toFixed(2)}{pick(locale, " · 积分 ", " · Points ")}{d.points}</p>
          {d.nextTier && (
            <>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream-100"><div className="h-full bg-sage-500" style={{ width: `${pct}%` }} /></div>
              <p className="mt-1 text-xs text-clay-500">{pick(locale, "再消费 ¥", "Spend ¥")}{((d.nextTier.minSpendCents - d.totalSpendCents) / 100).toFixed(2)}{pick(locale, " 升级到 ", " more to reach ")}{d.nextTier.name}</p>
            </>
          )}
        </div>
        <p className="text-sm text-clay-500">{pick(locale, "会员权益示例：小样抵扣、生日礼券、免服务费券、优先客服、礼盒折扣。", "Sample member perks: sample credit, birthday coupon, fee-waiver coupon, priority support, gift-box discount.")}</p>
      </div>
    </PageShell>
  );
}
