"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

export default function WardrobePage() {
  const { locale } = useLang();
  const [data, setData] = useState<{ items: { id: string; productId: string; role: string; note: string | null }[]; roleLabels: Record<string, string>; allRoles: string[]; suggestions: { role: string; reason: string }[] } | null>(null);
  const [auth, setAuth] = useState(true);
  const [f, setF] = useState({ productId: "", role: "commute" });

  function load() { fetch("/api/account/wardrobe").then((r) => { if (r.status === 401) { setAuth(false); return null; } return r.json(); }).then((j) => j && setData(j)); }
  useEffect(load, []);
  async function add() { if (!f.productId) return; await fetch("/api/account/wardrobe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); setF({ ...f, productId: "" }); load(); }
  async function del(id: string) { await fetch(`/api/account/wardrobe/${id}`, { method: "DELETE" }); load(); }

  if (!auth) return <PageShell><p className="text-sage-600">{pick(locale, "请先 ", "Please ")}<Link href="/account" className="underline">{pick(locale, "登录", "sign in")}</Link>{pick(locale, "。", " first.")}</p></PageShell>;
  if (!data) return <PageShell><p className="text-sage-600">{pick(locale, "加载中…", "Loading…")}</p></PageShell>;
  return (
    <PageShell>
      <div className="space-y-5">
        <Link href="/account" className="text-sm text-sage-600 underline">{pick(locale, "← 我的", "← My account")}</Link>
        <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "我的香味衣橱", "My scent wardrobe")}</h1>
        {data.suggestions.length > 0 && (
          <div className="rounded-2xl border border-clay-300 bg-clay-50/40 p-3 text-sm text-clay-600">
            {data.suggestions.map((s, i) => <p key={i}>· {s.reason}</p>)}
          </div>
        )}
        <div className="space-y-2">
          {data.items.map((i) => (
            <div key={i.id} className="flex justify-between rounded-xl border border-cream-200 p-3 text-sm">
              <span><span className="rounded bg-sage-500/10 px-2 py-0.5 text-xs text-sage-600">{data.roleLabels[i.role] ?? i.role}</span> {i.productId}</span>
              <button onClick={() => del(i.id)} className="text-xs text-clay-500">{pick(locale, "移除", "Remove")}</button>
            </div>
          ))}
          {data.items.length === 0 && <p className="text-sm text-clay-500">{pick(locale, "衣橱还空着，从一支日常香开始吧。", "Your wardrobe is empty — start with an everyday scent.")}</p>}
        </div>
        <div className="flex gap-2 rounded-2xl border border-cream-200 bg-cream-50 p-3 text-sm">
          <input className="flex-1 rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "商品ID", "Product ID")} value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })} />
          <select className="rounded border border-cream-300 px-2 py-1.5" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            {data.allRoles.map((r) => <option key={r} value={r}>{data.roleLabels[r]}</option>)}
          </select>
          <button onClick={add} className="rounded-lg bg-sage-500 px-3 text-white">{pick(locale, "加入", "Add")}</button>
        </div>
      </div>
    </PageShell>
  );
}
