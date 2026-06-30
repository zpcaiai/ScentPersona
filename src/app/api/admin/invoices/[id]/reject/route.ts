import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminOperator } from "@/lib/admin/auth";
import { auditAdminAction } from "@/lib/admin/audit";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const inv = await db.invoiceRequest.update({
    where: { id: params.id },
    data: { status: "rejected", note: sanitizeText(body.note, 200) },
  });
  await auditAdminAction({ orderId: inv.orderId, adminUserId: operator, action: "invoice_reject", detail: inv.id });
  return NextResponse.json({ ok: true });
}
