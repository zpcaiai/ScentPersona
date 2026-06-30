"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";
export default function ComplianceForm({ productId, initial }: { productId: string; initial?: Record<string, string> }) {
  const router = useRouter();
  const { locale } = useLang();
  const [f, setF] = useState({ filingNo: "", manufacturer: "", importer: "", originCountry: "", batchNo: "", shelfLife: "", allergenNotice: "", text: "", checkStatus: "passed", ...(initial || {}) });
  const [busy, setBusy] = useState(false);
  const [claims, setClaims] = useState<string | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  async function submit() {
    setBusy(true);
    const r = await fetch(`/api/admin/compliance/${productId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json();
    setBusy(false);
    setClaims(j.claims?.flags?.length ? `${pick(locale, "检测到风险文案：", "Risky copy detected: ")}${j.claims.flags.map((x: { matched: string }) => x.matched).join(pick(locale, "、", ", "))}` : pick(locale, "文案合规检查通过", "Copy passed compliance check"));
    router.refresh();
  }
  return (
    <div className="mt-4 space-y-2 rounded-xl border border-cream-200 bg-cream-50 p-4 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <input className="rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "备案号", "Filing number")} value={f.filingNo} onChange={set("filingNo")} />
        <input className="rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "生产商", "Manufacturer")} value={f.manufacturer} onChange={set("manufacturer")} />
        <input className="rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "进口商", "Importer")} value={f.importer} onChange={set("importer")} />
        <input className="rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "产地", "Country of origin")} value={f.originCountry} onChange={set("originCountry")} />
        <input className="rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "批号", "Batch number")} value={f.batchNo} onChange={set("batchNo")} />
        <input className="rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "保质期", "Shelf life")} value={f.shelfLife} onChange={set("shelfLife")} />
      </div>
      <input className="w-full rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "过敏提示", "Allergen notice")} value={f.allergenNotice} onChange={set("allergenNotice")} />
      <textarea className="w-full rounded border border-cream-300 px-2 py-1.5" rows={2} placeholder={pick(locale, "粘贴营销文案做合规检测（可选）", "Paste marketing copy for a compliance check (optional)")} value={f.text} onChange={set("text")} />
      <select className="w-full rounded border border-cream-300 px-2 py-1.5" value={f.checkStatus} onChange={set("checkStatus")}>
        <option value="passed">{pick(locale, "通过", "Passed")}</option><option value="warning">{pick(locale, "警告", "Warning")}</option><option value="failed">{pick(locale, "失败", "Failed")}</option><option value="needs_review">{pick(locale, "待复核", "Needs review")}</option>
      </select>
      <button disabled={busy} onClick={submit} className="w-full rounded-lg bg-sage-500 py-2 text-white">{pick(locale, "保存合规信息", "Save compliance info")}</button>
      {claims && <p className="text-clay-600">{claims}</p>}
    </div>
  );
}
