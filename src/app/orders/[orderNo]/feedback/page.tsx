"use client";
import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

function Inner() {
  const { locale } = useLang();
  const orderNo = useParams<{ orderNo: string }>().orderNo;
  const token = useSearchParams().get("token") ?? (typeof window !== "undefined" ? window.localStorage.getItem(`proxyToken:${orderNo}`) ?? "" : "");
  const [f, setF] = useState({ productId: "", likeLevel: "love", rating: 5, tooSweet: false, tooStrong: false, tooCold: false, tooLight: false, comment: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const tog = (k: "tooSweet" | "tooStrong" | "tooCold" | "tooLight") => setF((p) => ({ ...p, [k]: !p[k] }));

  async function submit() {
    if (!f.productId) { setMsg(pick(locale, "请填写商品ID", "Please enter the product ID")); return; }
    const r = await fetch(`/api/orders/${orderNo}/sample-feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, ...f }) });
    const j = await r.json();
    setMsg(r.ok ? (j.recommendation ? pick(locale, "感谢反馈！已为你生成正装推荐与小样抵扣券，去「我的券」看看。", "Thanks for your feedback! We've created a full-bottle recommendation and a sample-credit coupon — check 'Coupons'.") : pick(locale, "感谢反馈！", "Thanks for your feedback!")) : (j.error || pick(locale, "提交失败", "Submission failed")));
  }
  const likeOpts: [string, string][] = [["love", pick(locale, "很喜欢", "Love it")], ["like", pick(locale, "还不错", "Pretty good")], ["neutral", pick(locale, "一般", "It's okay")], ["dislike", pick(locale, "不适合", "Not for me")]];
  const togOpts = [["tooSweet", pick(locale, "太甜", "Too sweet")], ["tooStrong", pick(locale, "太浓", "Too strong")], ["tooCold", pick(locale, "太冷", "Too cold")], ["tooLight", pick(locale, "太淡", "Too light")]] as const;
  return (
    <div className="space-y-5">
      <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "试香反馈", "Scent trial feedback")}</h1>
      <p className="text-sm text-sage-600">{pick(locale, "先别急着一次闻完，今天先试一支，告诉我们最真实的感受。", "No need to smell them all at once — try one today and tell us how it really felt.")}</p>
      <input className="w-full rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "这支香的商品ID", "Product ID of this scent")} value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })} />
      <div className="flex gap-2">
        {likeOpts.map(([v, l]) => (
          <button key={v} onClick={() => setF({ ...f, likeLevel: v })} className={`rounded-full border px-3 py-1 text-sm ${f.likeLevel === v ? "border-sage-500 bg-sage-500 text-white" : "border-cream-300 text-sage-600"}`}>{l}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {togOpts.map(([k, l]) => (
          <button key={k} onClick={() => tog(k)} className={`rounded-full border px-3 py-1 text-sm ${f[k] ? "border-clay-400 bg-clay-50 text-clay-600" : "border-cream-300 text-sage-600"}`}>{l}</button>
        ))}
      </div>
      <textarea className="w-full rounded-lg border border-cream-300 px-3 py-2" rows={2} placeholder={pick(locale, "想多说两句（可选）", "Anything else? (optional)")} value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} />
      {msg && <p className="text-sm text-sage-600">{msg}</p>}
      <button onClick={submit} className="w-full rounded-xl bg-sage-500 py-3 text-white">{pick(locale, "提交反馈", "Submit feedback")}</button>
      <Link href="/account/coupons" className="block text-center text-sm text-sage-600 underline">{pick(locale, "查看正装推荐与券", "See full-bottle picks & coupons")}</Link>
    </div>
  );
}
export default function FeedbackPage() {
  return <PageShell><Suspense fallback={<p className="text-sage-600">…</p>}><Inner /></Suspense></PageShell>;
}
