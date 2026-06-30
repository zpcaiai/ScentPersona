"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

export default function TicketThread() {
  const { locale } = useLang();
  const ticketNo = useParams<{ ticketNo: string }>().ticketNo;
  const [data, setData] = useState<{ ticket: { subject: string; status: string }; messages: { senderType: string; message: string; createdAt: string }[] } | null>(null);
  const [reply, setReply] = useState("");

  const load = useCallback(() => { fetch(`/api/support/${ticketNo}/message`).then((r) => r.json()).then((j) => { if (!j.error) setData(j); }); }, [ticketNo]);
  useEffect(load, [load]);

  async function send() {
    if (!reply.trim()) return;
    await fetch(`/api/support/${ticketNo}/message`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: reply }) });
    setReply(""); load();
  }
  if (!data) return <PageShell><p className="text-sage-600">{pick(locale, "加载中…", "Loading…")}</p></PageShell>;
  return (
    <PageShell>
      <Link href="/support" className="text-sm text-sage-600 underline">{pick(locale, "← 客服", "← Support")}</Link>
      <h1 className="mt-2 font-serif text-xl text-sage-600">{data.ticket.subject}</h1>
      <p className="text-xs text-clay-500">{data.ticket.status}</p>
      <div className="mt-4 space-y-2">
        {data.messages.map((m, i) => (
          <div key={i} className={`max-w-[80%] rounded-xl p-2 text-sm ${m.senderType === "user" ? "ml-auto bg-sage-500 text-white" : "bg-cream-100"}`}>{m.message}</div>
        ))}
      </div>
      {data.ticket.status !== "closed" && (
        <div className="mt-4 flex gap-2">
          <input className="flex-1 rounded-lg border border-cream-300 px-3 py-2" value={reply} onChange={(e) => setReply(e.target.value)} placeholder={pick(locale, "回复…", "Reply…")} />
          <button onClick={send} className="rounded-lg bg-sage-500 px-4 text-white">{pick(locale, "发送", "Send")}</button>
        </div>
      )}
    </PageShell>
  );
}
