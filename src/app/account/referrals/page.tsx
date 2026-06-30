"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

export default function ReferralsPage() {
  const { locale } = useLang();
  const [data, setData] = useState<{ code: string; rewards: { rewardType: string; rewardValue: number; status: string }[] } | null>(null);
  const [auth, setAuth] = useState(true);
  const [redeem, setRedeem] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function load() { fetch("/api/account/referrals").then((r) => { if (r.status === 401) { setAuth(false); return null; } return r.json(); }).then((j) => j && setData(j)); }
  useEffect(load, []);
  async function submit() {
    const r = await fetch("/api/account/referrals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: redeem }) });
    const j = await r.json(); setMsg(r.ok ? pick(locale, "已绑定邀请，奖励将在你完成首单后发放", "Referral linked — your reward arrives once you complete your first order") : (j.error || pick(locale, "失败", "Something went wrong"))); if (r.ok) load();
  }
  if (!auth) return <PageShell><p className="text-sage-600">{pick(locale, "请先 ", "Please ")}<Link href="/account" className="underline">{pick(locale, "登录", "sign in")}</Link>{pick(locale, "。", " first.")}</p></PageShell>;
  if (!data) return <PageShell><p className="text-sage-600">{pick(locale, "加载中…", "Loading…")}</p></PageShell>;
  return (
    <PageShell>
      <div className="space-y-5">
        <Link href="/account" className="text-sm text-sage-600 underline">{pick(locale, "← 我的", "← My account")}</Link>
        <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "邀请有礼", "Refer a friend")}</h1>
        <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 text-center">
          <p className="text-sm text-sage-600">{pick(locale, "我的邀请码", "My referral code")}</p>
          <p className="font-serif text-2xl tracking-widest text-clay-600">{data.code}</p>
          <p className="mt-1 text-xs text-clay-500">{pick(locale, "好友通过此码下单，双方各得优惠（订单完成后发放，防自邀）。", "When a friend orders with this code, you both get a reward (issued after the order completes; self-referrals don't count).")}</p>
        </div>
        <div className="flex gap-2">
          <input className="flex-1 rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "输入好友邀请码", "Enter a friend's referral code")} value={redeem} onChange={(e) => setRedeem(e.target.value)} />
          <button onClick={submit} className="rounded-lg bg-sage-500 px-4 text-white">{pick(locale, "绑定", "Apply")}</button>
        </div>
        {msg && <p className="text-sm text-sage-600">{msg}</p>}
        <section>
          <h2 className="font-medium text-sage-600">{pick(locale, "我的奖励", "My rewards")}</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {data.rewards.map((r, i) => <li key={i} className="flex justify-between border-b border-cream-200 py-1"><span>{r.rewardType}</span><span className="text-clay-500">{r.status}</span></li>)}
            {data.rewards.length === 0 && <li className="text-clay-500">{pick(locale, "还没有奖励。", "No rewards yet.")}</li>}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
