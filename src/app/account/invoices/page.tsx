"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

export default function InvoicesPage() {
  const { locale } = useLang();
  const [list, setList] = useState<{ id: string; title: string; amountCents: number; status: string }[]>([]);
  const [auth, setAuth] = useState(true);
  const [f, setF] = useState({ orderNo: "", invoiceType: "personal", title: "", taxNo: "", email: "" });
  const [msg, setMsg] = useState<string | null>(null);

  function load() { fetch("/api/account/invoices").then((r) => { if (r.status === 401) { setAuth(false); return null; } return r.json(); }).then((j) => j && setList(j.invoices)); }
  useEffect(load, []);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit() {
    const r = await fetch("/api/account/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json();
    setMsg(r.ok ? pick(locale, "已提交开票申请", "Invoice request submitted") : (j.error || pick(locale, "提交失败", "Submission failed")));
    if (r.ok) load();
  }
  if (!auth) return <PageShell><p className="text-sage-600">{pick(locale, "请先 ", "Please ")}<Link href="/account" className="underline">{pick(locale, "登录", "sign in")}</Link>{pick(locale, "。", " first.")}</p></PageShell>;

  return (
    <PageShell>
      <div className="space-y-5">
        <Link href="/account" className="text-sm text-sage-600 underline">{pick(locale, "← 我的", "← My account")}</Link>
        <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "发票", "Invoices")}</h1>
        <div className="space-y-2 rounded-2xl border border-cream-200 bg-cream-50 p-4">
          <input className="w-full rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "订单号", "Order number")} value={f.orderNo} onChange={set("orderNo")} />
          <select className="w-full rounded-lg border border-cream-300 px-3 py-2" value={f.invoiceType} onChange={(e) => setF((p) => ({ ...p, invoiceType: e.target.value }))}>
            <option value="personal">{pick(locale, "个人", "Personal")}</option><option value="company">{pick(locale, "企业", "Business")}</option>
          </select>
          <input className="w-full rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "抬头", "Invoice title")} value={f.title} onChange={set("title")} />
          {f.invoiceType === "company" && <input className="w-full rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "税号", "Tax ID")} value={f.taxNo} onChange={set("taxNo")} />}
          <input className="w-full rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "接收邮箱", "Recipient email")} value={f.email} onChange={set("email")} />
          <button onClick={submit} className="w-full rounded-xl bg-sage-500 py-2.5 text-white">{pick(locale, "申请开票", "Request invoice")}</button>
          {msg && <p className="text-sm text-sage-600">{msg}</p>}
        </div>
        <div className="space-y-2">
          {list.map((i) => (
            <div key={i.id} className="flex justify-between rounded-xl border border-cream-200 p-3 text-sm">
              <span>{i.title} · ¥{(i.amountCents / 100).toFixed(2)}</span>
              <span className="text-clay-500">{i.status}</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
