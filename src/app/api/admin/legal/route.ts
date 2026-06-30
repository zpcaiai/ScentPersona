import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminOperator } from "@/lib/admin/auth";
import { auditAdminAction } from "@/lib/admin/audit";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

const TYPES = ["terms", "privacy", "proxy_order_agreement", "refund_policy", "shipping_policy"];

export async function POST(request: Request) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const type = sanitizeText(body.type, 40);
  const version = sanitizeText(body.version, 20);
  const title = sanitizeText(body.title, 120);
  const content = typeof body.content === "string" ? body.content.slice(0, 50000) : "";
  if (!type || !TYPES.includes(type) || !version || !title || !content) {
    return NextResponse.json({ error: "invalid_document" }, { status: 400 });
  }
  const doc = await db.legalDocument.create({ data: { type, version, title, content } });
  await auditAdminAction({ adminUserId: operator, action: "legal_create", detail: `${type} ${version}` });
  return NextResponse.json({ ok: true, id: doc.id });
}
