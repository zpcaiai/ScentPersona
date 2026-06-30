import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminOperator } from "@/lib/admin/auth";
import { auditAdminAction } from "@/lib/admin/audit";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const slug = sanitizeText(body.slug, 60);
  const title = sanitizeText(body.title, 120);
  if (!slug || !title) return NextResponse.json({ error: "slug_and_title_required" }, { status: 400 });
  let blocks = "[]";
  if (typeof body.contentBlocksJson === "string") {
    try { JSON.parse(body.contentBlocksJson); blocks = body.contentBlocksJson; } catch { /* keep [] */ }
  }
  try {
    const page = await db.contentPage.create({
      data: {
        slug, title,
        subtitle: sanitizeText(body.subtitle, 200),
        pageType: sanitizeText(body.pageType, 20) ?? "landing",
        heroImageUrl: sanitizeText(body.heroImageUrl, 500),
        contentBlocksJson: blocks,
        seoTitle: sanitizeText(body.seoTitle, 120),
        seoDescription: sanitizeText(body.seoDescription, 300),
      },
    });
    await auditAdminAction({ adminUserId: operator, action: "content_create", detail: slug });
    return NextResponse.json({ ok: true, id: page.id });
  } catch {
    return NextResponse.json({ error: "slug_exists" }, { status: 409 });
  }
}
