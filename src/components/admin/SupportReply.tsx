"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";
export default function SupportReply({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const { locale } = useLang();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function send(close = false) {
    setBusy(true);
    if (close) await fetch(`/api/admin/support/${ticketId}/close`, { method: "POST" });
    else await fetch(`/api/admin/support/${ticketId}/reply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg }) });
    setBusy(false); setMsg(""); router.refresh();
  }
  return (
    <div className="mt-4 space-y-2">
      <textarea className="w-full rounded-lg border border-cream-300 px-3 py-2 text-sm" rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={pick(locale, "回复用户（用户看不到后台备注）", "Reply to user (internal admin notes are hidden from them)")} />
      <div className="flex gap-2">
        <button disabled={busy || !msg.trim()} onClick={() => send(false)} className="rounded-lg bg-sage-500 px-4 py-1.5 text-sm text-white disabled:opacity-50">{pick(locale, "回复", "Reply")}</button>
        <button disabled={busy} onClick={() => send(true)} className="rounded-lg border border-clay-300 px-4 py-1.5 text-sm text-clay-600">{pick(locale, "关闭工单", "Close ticket")}</button>
      </div>
    </div>
  );
}
