import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminOperator } from "@/lib/admin/auth";
import { auditAdminAction } from "@/lib/admin/audit";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const invoiceUrl = sanitizeText(body.invoiceUrl, 500);
  const inv = await db.invoiceRequest.update({
    where: { id: params.id },
    data: { status: "issued", issuedAt: new Date(), invoiceUrl },
  });
  await auditAdminAction({ orderId: inv.orderId, adminUserId: operator, action: "invoice_issue", detail: inv.id });
  return NextResponse.json({ ok: true });
}
