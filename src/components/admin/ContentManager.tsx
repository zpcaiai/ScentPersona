"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";
import ImageUpload from "@/components/admin/ImageUpload";
export default function ContentManager({ pages }: { pages: { id: string; slug: string; title: string; status: string }[] }) {
  const router = useRouter();
  const { locale } = useLang();
  const [f, setF] = useState({ slug: "", title: "", subtitle: "", pageType: "landing", heroImageUrl: "", contentBlocksJson: "", seoTitle: "", seoDescription: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function create() {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json(); setBusy(false); setMsg(r.ok ? pick(locale, "已创建（草稿）", "Created (draft)") : j.error);
    if (r.ok) { setF({ ...f, slug: "", title: "" }); router.refresh(); }
  }
  async function toggle(id: string, status: string) {
    await fetch(`/api/admin/content/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: status === "published" ? "unpublish" : "publish" }) });
    router.refresh();
  }
  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border border-cream-200 bg-cream-50 p-4 text-sm">
        <input className="w-full rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "slug，如 men-first-fragrance", "slug, e.g. men-first-fragrance")} value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />
        <input className="w-full rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "标题", "Title")} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input className="w-full rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "副标题", "Subtitle")} value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <input className="flex-1 rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "Hero 图 URL（可粘贴或上传）", "Hero image URL (paste or upload)")} value={f.heroImageUrl} onChange={(e) => setF({ ...f, heroImageUrl: e.target.value })} />
            <ImageUpload prefix="hero" onUploaded={(url) => setF({ ...f, heroImageUrl: url })} />
          </div>
          {f.heroImageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={f.heroImageUrl} alt="" className="h-20 w-full rounded object-cover" />
          )}
        </div>
        <textarea className="w-full rounded border border-cream-300 px-2 py-1.5 font-mono text-xs" rows={5} placeholder={pick(locale, '内容块 JSON，如 [{"title":"为什么是它","text":"...","cta":{"label":"开始测试","href":"/quiz"}}]', 'Content blocks JSON, e.g. [{"title":"Why this one","text":"...","cta":{"label":"Start the quiz","href":"/quiz"}}]')} value={f.contentBlocksJson} onChange={(e) => setF({ ...f, contentBlocksJson: e.target.value })} />
        <input className="w-full rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "SEO 标题", "SEO title")} value={f.seoTitle} onChange={(e) => setF({ ...f, seoTitle: e.target.value })} />
        <button disabled={busy} onClick={create} className="w-full rounded-lg bg-sage-500 py-2 text-white">{pick(locale, "创建专题页", "Create page")}</button>
        {msg && <p className="text-clay-600">{msg}</p>}
      </div>
      <ul className="space-y-1 text-sm">
        {pages.map((p) => (
          <li key={p.id} className="flex justify-between border-b border-cream-200 py-1">
            <a href={`/c/${p.slug}`} target="_blank" rel="noreferrer" className="text-sage-600 underline">/c/{p.slug}</a>
            <span className="space-x-3"><span className="text-clay-500">{p.status}</span><button onClick={() => toggle(p.id, p.status)} className="text-sage-600 underline">{p.status === "published" ? pick(locale, "下线", "Unpublish") : pick(locale, "发布", "Publish")}</button></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
