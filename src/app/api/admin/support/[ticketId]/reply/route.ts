import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminOperator } from "@/lib/admin/auth";
import { auditAdminAction } from "@/lib/admin/audit";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { ticketId: string } }) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  let message = sanitizeText(body.message, 2000);
  const templateId = sanitizeText(body.templateId, 40);
  if (!message && templateId) {
    const t = await db.supportTemplate.findUnique({ where: { id: templateId } });
    message = t?.content ?? null;
  }
  if (!message) return NextResponse.json({ error: "empty" }, { status: 400 });
  const ticket = await db.supportTicket.findUnique({ where: { id: params.ticketId } });
  if (!ticket) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await db.supportMessage.create({ data: { ticketId: ticket.id, senderType: "admin", senderId: operator, message } });
  await db.supportTicket.update({ where: { id: ticket.id }, data: { status: "waiting_user", latestMessage: message, assignedTo: operator } });
  await auditAdminAction({ adminUserId: operator, action: "support_reply", detail: ticket.ticketNo });
  return NextResponse.json({ ok: true });
}
