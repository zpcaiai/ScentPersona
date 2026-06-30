import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";
import { rateLimit, getClientKey, sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

const CATEGORIES = ["order_question", "price_changed", "out_of_stock", "shipping_issue", "refund", "product_authenticity", "scent_recommendation", "invoice", "after_sales", "other"];

function ticketNo(): string {
  return `T${new Date().toISOString().slice(0, 10).replace(/-/g, "")}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const tickets = await db.supportTicket.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 50 });
  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  if (!rateLimit(getClientKey(request, "support"), 10, 60_000)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const category = sanitizeText(body.category, 30) ?? "other";
  const subject = sanitizeText(body.subject, 120);
  const message = sanitizeText(body.message, 1000);
  if (!CATEGORIES.includes(category) || !subject || !message) return NextResponse.json({ error: "invalid" }, { status: 400 });

  let orderId: string | null = null;
  const orderNo = sanitizeText(body.orderNo, 40);
  if (orderNo) {
    const o = await db.order.findUnique({ where: { orderNo } });
    if (o) orderId = o.id;
  }

  const ticket = await db.supportTicket.create({
    data: {
      ticketNo: ticketNo(),
      userId,
      orderId,
      category,
      priority: category === "refund" || category === "product_authenticity" ? "high" : "normal",
      status: "waiting_admin",
      subject,
      latestMessage: message,
      messages: { create: { senderType: "user", senderId: userId, message } },
    },
  });
  return NextResponse.json({ ok: true, ticketNo: ticket.ticketNo });
}
