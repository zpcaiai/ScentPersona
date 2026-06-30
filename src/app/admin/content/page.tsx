import { db } from "@/lib/db";
import ContentManager from "@/components/admin/ContentManager";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";
export const dynamic = "force-dynamic";
export default async function AdminContentPage() {
  const locale = getLocale();
  const pages = await db.contentPage.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "内容 / 专题页", "Content / topic pages")}</h1>
      <p className="text-sm text-clay-500">{pick(locale, "用于小红书/SEO/投放落地页，如「男生第一支香水」「送礼不踩雷」。内容走数据库，不写死在组件里。", "Landing pages for social/SEO/ads, e.g. \u201CA man\u2019s first fragrance\u201D or \u201CGifting without missteps.\u201D Content lives in the database, not hardcoded in components.")}</p>
      <div className="mt-4"><ContentManager pages={pages.map((p: { id: string; slug: string; title: string; status: string }) => ({ id: p.id, slug: p.slug, title: p.title, status: p.status }))} /></div>
    </main>
  );
}
