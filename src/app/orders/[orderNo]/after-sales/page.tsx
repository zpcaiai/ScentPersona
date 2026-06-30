"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

function Inner() {
  const { locale } = useLang();
  const TYPES: { v: string; l: string }[] = [
    { v: "damaged", l: pick(locale, "破损", "Damaged") }, { v: "wrong_item", l: pick(locale, "错发", "Wrong item") }, { v: "authenticity", l: pick(locale, "真假争议", "Authenticity dispute") },
    { v: "missing", l: pick(locale, "未收到", "Not received") }, { v: "logistics", l: pick(locale, "物流问题", "Shipping issue") }, { v: "allergy", l: pick(locale, "过敏", "Allergy") },
    { v: "dislike", l: pick(locale, "不喜欢", "Don't like it") }, { v: "other", l: pick(locale, "其他", "Other") },
  ];
  const orderNo = useParams<{ orderNo: string }>().orderNo;
  const token = useSearchParams().get("token") ?? (typeof window !== "undefined" ? window.localStorage.getItem(`proxyToken:${orderNo}`) ?? "" : "");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [reqs, setReqs] = useState<Record<string, string[]>>({});
  const [cases, setCases] = useState<{ caseNo: string; type: string; status: string }[]>([]);
  const [type, setType] = useState("damaged");
  const [desc, setDesc] = useState("");
  const [ev, setEv] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/proxy-orders/detail?orderNo=${encodeURIComponent(orderNo)}&token=${encodeURIComponent(token)}`)
      .then((r) => r.json()).then((d) => { if (d.orderId) { setOrderId(d.orderId); loadCases(d.orderId); } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNo, token]);

  function loadCases(id: string) {
    fetch(`/api/proxy-orders/${id}/after-sales?token=${encodeURIComponent(token)}`).then((r) => r.json()).then((d) => {
      if (d.requirements) setReqs(d.requirements);
      if (d.cases) setCases(d.cases);
    });
  }

  async function submit() {
    if (!orderId || !desc) { setMsg(pick(locale, "请填写问题描述", "Please describe the issue")); return; }
    setBusy(true); setMsg(null);
    const evidence = ev.trim() ? [{ evidenceType: "text", text: ev.trim() }] : [];
    const r = await fetch(`/api/proxy-orders/${orderId}/after-sales`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, type, userDescription: desc, evidence }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) setMsg(j.error || pick(locale, "提交失败", "Submission failed"));
    else { setMsg(`${pick(locale, "已提交，工单号", "Submitted. Case no.")} ${j.caseNo}`); setDesc(""); setEv(""); loadCases(orderId); }
  }

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "申请售后", "Request after-sales")}</h1>
      <p className="text-sm text-sage-600">{pick(locale, "订单", "Order")} {orderNo}。{pick(locale, "请如实描述问题，我们会尽快处理，文案不代表对你的不信任。", "Please describe the issue honestly — we'll handle it as soon as possible.")}</p>

      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button key={t.v} onClick={() => setType(t.v)} className={`rounded-full border px-3 py-1 text-sm ${type === t.v ? "border-sage-500 bg-sage-500 text-white" : "border-cream-300 text-sage-600"}`}>{t.l}</button>
        ))}
      </div>

      {reqs[type] && (
        <div className="rounded-xl border border-clay-300 bg-clay-50/40 p-3 text-sm text-clay-600">
          {pick(locale, "建议提供：", "Suggested to provide: ")}{reqs[type].join(pick(locale, "、", ", "))}
        </div>
      )}

      <textarea className="w-full rounded-lg border border-cream-300 px-3 py-2" rows={4} placeholder={pick(locale, "问题描述", "Describe the issue")} value={desc} onChange={(e) => setDesc(e.target.value)} />
      <textarea className="w-full rounded-lg border border-cream-300 px-3 py-2" rows={2} placeholder={pick(locale, "补充证据说明（如运单号、签收情况等）", "Supporting details (tracking number, delivery status, etc.)")} value={ev} onChange={(e) => setEv(e.target.value)} />
      {msg && <p className="text-sm text-sage-600">{msg}</p>}
      <button onClick={submit} disabled={busy} className="w-full rounded-xl bg-sage-500 py-3 text-white disabled:opacity-50">{busy ? pick(locale, "提交中…", "Submitting…") : pick(locale, "提交售后", "Submit request")}</button>

      {cases.length > 0 && (
        <section>
          <h2 className="font-medium text-sage-600">{pick(locale, "历史售后", "Past cases")}</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {cases.map((c) => <li key={c.caseNo} className="flex justify-between border-b border-cream-200 py-1"><span className="font-mono text-xs">{c.caseNo}</span><span>{c.status}</span></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function AfterSalesPage() {
  return <PageShell><Suspense fallback={<p className="text-sage-600">…</p>}><Inner /></Suspense></PageShell>;
}
