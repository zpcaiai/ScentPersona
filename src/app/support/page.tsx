"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

export default function SupportPage() {
  const { locale } = useLang();
  const CATS: { v: string; l: string }[] = [
    { v: "order_question", l: pick(locale, "订单咨询", "Order question") }, { v: "shipping_issue", l: pick(locale, "物流", "Shipping") }, { v: "refund", l: pick(locale, "退款", "Refund") },
    { v: "product_authenticity", l: pick(locale, "真假", "Authenticity") }, { v: "scent_recommendation", l: pick(locale, "选香", "Scent advice") }, { v: "invoice", l: pick(locale, "发票", "Invoice") }, { v: "other", l: pick(locale, "其他", "Other") },
  ];
  const [tickets, setTickets] = useState<{ ticketNo: string; subject: string; status: string }[]>([]);
  const [auth, setAuth] = useState(true);
  const [f, setF] = useState({ category: "order_question", subject: "", message: "", orderNo: "" });
  const [msg, setMsg] = useState<string | null>(null);

  function load() { fetch("/api/support").then((r) => { if (r.status === 401) { setAuth(false); return null; } return r.json(); }).then((j) => j && setTickets(j.tickets)); }
  useEffect(load, []);

  async function submit() {
    const r = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json();
    setMsg(r.ok ? `${pick(locale, "已提交", "Submitted")}：${j.ticketNo}` : (j.error || pick(locale, "提交失败", "Submission failed")));
    if (r.ok) { setF({ ...f, subject: "", message: "" }); load(); }
  }
  if (!auth) return <PageShell><p className="text-sage-600">{pick(locale, "请先 ", "Please ")}<Link href="/account" className="underline">{pick(locale, "登录", "sign in")}</Link>{pick(locale, " 后联系客服。", " to contact support.")}</p></PageShell>;

  return (
    <PageShell>
      <div className="space-y-5">
        <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "联系客服", "Contact support")}</h1>
        <div className="space-y-2 rounded-2xl border border-cream-200 bg-cream-50 p-4">
          <select className="w-full rounded-lg border border-cream-300 px-3 py-2" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            {CATS.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
          </select>
          <input className="w-full rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "订单号（可选）", "Order number (optional)")} value={f.orderNo} onChange={(e) => setF({ ...f, orderNo: e.target.value })} />
          <input className="w-full rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "主题", "Subject")} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
          <textarea className="w-full rounded-lg border border-cream-300 px-3 py-2" rows={3} placeholder={pick(locale, "问题描述", "Describe your issue")} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
          <button onClick={submit} className="w-full rounded-xl bg-sage-500 py-2.5 text-white">{pick(locale, "提交工单", "Submit ticket")}</button>
          {msg && <p className="text-sm text-sage-600">{msg}</p>}
        </div>
        <div className="space-y-2">
          {tickets.map((t) => (
            <Link key={t.ticketNo} href={`/support/${t.ticketNo}`} className="flex justify-between rounded-xl border border-cream-200 p-3 text-sm">
              <span>{t.subject}</span><span className="text-clay-500">{t.status}</span>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
