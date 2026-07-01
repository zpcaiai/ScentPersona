import Link from "next/link";
import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "香氛专题 | ScentPersona",
  description: "按场景和香型精选的选香专题：夏日柑橘、职场淡香、约会甜香、小众沙龙、四季衣橱等。",
};

export default async function TopicsIndexPage() {
  const locale = getLocale();
  const topics = await db.contentPage.findMany({
    where: { status: "published", pageType: "landing" },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, title: true, subtitle: true },
  });

  return (
    <PageShell>
      <header className="mb-6">
        <h1 className="font-serif text-3xl text-sage-600">{pick(locale, "香氛专题", "Scent Topics")}</h1>
        <p className="mt-1 text-sage-600">
          {pick(locale, "按场景和香型，挑一个此刻的心情", "Pick a topic for your mood or occasion")}
        </p>
      </header>

      {topics.length === 0 ? (
        <p className="text-sage-700">{pick(locale, "暂无专题", "No topics yet")}</p>
      ) : (
        <div className="grid gap-3">
          {topics.map((t) => (
            <Link key={t.slug} href={`/c/${t.slug}`} className="card hover:border-sage-400 transition-colors">
              <div className="font-serif text-lg text-stone-800">{t.title}</div>
              {t.subtitle && <div className="text-sm text-stone-500 mt-1">{t.subtitle}</div>}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/quiz" className="inline-block rounded-xl bg-sage-500 px-5 py-2.5 font-medium text-white">
          {pick(locale, "开始选香测试", "Start the scent quiz")}
        </Link>
      </div>
    </PageShell>
  );
}
