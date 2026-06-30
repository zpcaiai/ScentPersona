import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const invoices = await db.invoiceRequest.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({ where: { id: userId } });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const orderNo = sanitizeText(body.orderNo, 40);
  const title = sanitizeText(body.title, 120);
  const email = sanitizeText(body.email, 120);
  const invoiceType = body.invoiceType === "company" ? "company" : "personal";
  if (!orderNo || !title || !email) return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  const order = await db.order.findUnique({ where: { orderNo } });
  if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  const owns = order.userId === userId || (user?.phone && order.customerPhone === user.phone);
  if (!owns) return NextResponse.json({ error: "not_your_order" }, { status: 403 });

  // Invoice amount cannot exceed what was actually paid.
  const amountCents = order.finalTotalCents ?? order.amount;
  const inv = await db.invoiceRequest.create({
    data: {
      userId,
      orderId: order.id,
      invoiceType,
      title,
      taxNo: sanitizeText(body.taxNo, 40),
      email,
      amountCents,
      status: "requested",
    },
  });
  return NextResponse.json({ ok: true, id: inv.id, amountCents });
}
