"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";
const TYPES = ["terms", "privacy", "proxy_order_agreement", "refund_policy", "shipping_policy"];
export default function LegalManager({ docs }: { docs: { id: string; type: string; version: string; title: string; isActive: boolean }[] }) {
  const router = useRouter();
  const { locale } = useLang();
  const [f, setF] = useState({ type: "proxy_order_agreement", version: "", title: "", content: "" });
  const [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true);
    await fetch("/api/admin/legal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    setBusy(false); setF({ ...f, version: "", title: "", content: "" }); router.refresh();
  }
  async function publish(id: string) { await fetch(`/api/admin/legal/${id}/publish`, { method: "POST" }); router.refresh(); }
  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border border-cream-200 bg-cream-50 p-4 text-sm">
        <select className="w-full rounded border border-cream-300 px-2 py-1.5" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input className="w-full rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "版本，如 v1", "Version, e.g. v1")} value={f.version} onChange={(e) => setF({ ...f, version: e.target.value })} />
        <input className="w-full rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "标题", "Title")} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <textarea className="w-full rounded border border-cream-300 px-2 py-1.5" rows={5} placeholder={pick(locale, "正文", "Body")} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} />
        <button disabled={busy} onClick={create} className="w-full rounded-lg bg-sage-500 py-2 text-white">{pick(locale, "创建版本", "Create version")}</button>
      </div>
      <ul className="space-y-1 text-sm">
        {docs.map((d) => (
          <li key={d.id} className="flex justify-between border-b border-cream-200 py-1">
            <span>{d.type} · {d.version} · {d.title} {d.isActive && <span className="ml-1 rounded bg-sage-500 px-1.5 text-xs text-white">{pick(locale, "生效中", "Active")}</span>}</span>
            {!d.isActive && <button onClick={() => publish(d.id)} className="text-sage-600 underline">{pick(locale, "发布", "Publish")}</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
