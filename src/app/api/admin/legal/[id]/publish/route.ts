import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminOperator } from "@/lib/admin/auth";
import { auditAdminAction } from "@/lib/admin/audit";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const operator = getAdminOperator(request);
  const doc = await db.legalDocument.findUnique({ where: { id: params.id } });
  if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await db.legalDocument.updateMany({ where: { type: doc.type, isActive: true }, data: { isActive: false } });
  await db.legalDocument.update({ where: { id: doc.id }, data: { isActive: true, publishedAt: new Date() } });
  await auditAdminAction({ adminUserId: operator, action: "legal_publish", detail: `${doc.type} ${doc.version}` });
  return NextResponse.json({ ok: true });
}
