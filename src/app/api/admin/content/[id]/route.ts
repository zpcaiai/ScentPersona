import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminOperator } from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = body.action; // publish | unpublish
  if (action === "publish") {
    await db.contentPage.update({ where: { id: params.id }, data: { status: "published", publishedAt: new Date() } });
  } else if (action === "unpublish") {
    await db.contentPage.update({ where: { id: params.id }, data: { status: "draft" } });
  }
  return NextResponse.json({ ok: true });
}
