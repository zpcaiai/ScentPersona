import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const page = await db.contentPage.findFirst({ where: { slug: params.slug, status: "published" } });
  if (!page) return NextResponse.json({ error: "not_found" }, { status: 404 });
  let blocks: unknown[] = [];
  try { blocks = JSON.parse(page.contentBlocksJson || "[]"); } catch { /* */ }
  return NextResponse.json({
    title: page.title, subtitle: page.subtitle, heroImageUrl: page.heroImageUrl,
    contentBlocks: blocks, seoTitle: page.seoTitle, seoDescription: page.seoDescription,
  });
}
