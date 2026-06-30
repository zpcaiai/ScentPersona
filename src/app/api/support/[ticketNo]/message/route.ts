import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: { ticketNo: string } }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const ticket = await db.supportTicket.findUnique({ where: { ticketNo: params.ticketNo }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  if (!ticket || ticket.userId !== userId) return NextResponse.json({ error: "not_found" }, { status: 404 });
  // Users never see internal sender ids.
  return NextResponse.json({
    ticket: { ticketNo: ticket.ticketNo, subject: ticket.subject, status: ticket.status, category: ticket.category },
    messages: ticket.messages.map((m: { senderType: string; message: string; createdAt: Date }) => ({ senderType: m.senderType, message: m.message, createdAt: m.createdAt })),
  });
}

export async function POST(request: Request, { params }: { params: { ticketNo: string } }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const ticket = await db.supportTicket.findUnique({ where: { ticketNo: params.ticketNo } });
  if (!ticket || ticket.userId !== userId) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const message = sanitizeText(body.message, 1000);
  if (!message) return NextResponse.json({ error: "empty" }, { status: 400 });
  await db.supportMessage.create({ data: { ticketId: ticket.id, senderType: "user", senderId: userId, message } });
  await db.supportTicket.update({ where: { id: ticket.id }, data: { status: "waiting_admin", latestMessage: message } });
  return NextResponse.json({ ok: true });
}
