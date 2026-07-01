/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";
import TopicProducts from "@/components/content/TopicProducts";

export const dynamic = "force-dynamic";

interface Block { type: string; title?: string; text?: string; items?: string[]; family?: string; cta?: { label: string; href: string } }

async function getPage(slug: string) {
  return db.contentPage.findFirst({ where: { slug, status: "published" } });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPage(params.slug);
  return { title: p?.seoTitle ?? p?.title ?? "ScentPersona", description: p?.seoDescription ?? undefined };
}

export default async function ContentLandingPage({ params }: { params: { slug: string } }) {
  const locale = getLocale();
  const page = await getPage(params.slug);
  if (!page) notFound();
  let blocks: Block[] = [];
  try { blocks = JSON.parse(page.contentBlocksJson || "[]"); } catch { /* */ }

  return (
    <PageShell>
      <article className="space-y-6">
        {page.heroImageUrl && <img src={page.heroImageUrl} alt="" className="w-full rounded-2xl object-cover" />}
        <header>
          <h1 className="font-serif text-3xl text-sage-600">{page.title}</h1>
          {page.subtitle && <p className="mt-1 text-sage-600">{page.subtitle}</p>}
        </header>
        {blocks.filter((b) => b.type !== "products").map((b, i) => (
          <section key={i} className="space-y-2">
            {b.title && <h2 className="font-serif text-xl text-clay-600">{b.title}</h2>}
            {b.text && <p className="whitespace-pre-wrap text-sage-700">{b.text}</p>}
            {b.items && <ul className="list-disc space-y-1 pl-5 text-sage-700">{b.items.map((it, n) => <li key={n}>{it}</li>)}</ul>}
            {b.cta && <Link href={b.cta.href} className="inline-block rounded-xl bg-sage-500 px-5 py-2.5 font-medium text-white">{b.cta.label}</Link>}
          </section>
        ))}
        {blocks.filter((b) => b.type === "products").map((b, i) => (
          <TopicProducts key={`p${i}`} family={b.family} title={b.title} />
        ))}
        {blocks.length === 0 && (
          <Link href="/quiz" className="inline-block rounded-xl bg-sage-500 px-5 py-2.5 font-medium text-white">{pick(locale, "开始选香测试", "Start the scent quiz")}</Link>
        )}
      </article>
    </PageShell>
  );
}
