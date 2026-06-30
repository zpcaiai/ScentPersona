import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientKey, sanitizeText } from "@/lib/api-guards";
import { verifyOrderLookup } from "@/lib/orders/orderLookup";
import { canTransition, type OrderStatus } from "@/lib/orders/orderStatus";
import { transitionOrderStatus, recordOrderEvent } from "@/lib/orders/transitionOrderStatus";
import { scoreAfterSalesRisk, EVIDENCE_REQUIREMENTS } from "@/lib/after-sales/riskScore";

export const runtime = "nodejs";

const DAY30 = 30 * 24 * 60 * 60 * 1000;

function caseNo(): string {
  return `AS${new Date().toISOString().slice(0, 10).replace(/-/g, "")}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function GET(request: Request, { params }: { params: { orderId: string } }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? undefined;
  const order = await db.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.orderType !== "proxy") return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  if (!verifyOrderLookup(order, { token })) return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  const cases = await db.afterSalesCase.findMany({ where: { orderId: order.id }, include: { evidence: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ requirements: EVIDENCE_REQUIREMENTS, cases });
}

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  if (!rateLimit(getClientKey(request, "after-sales"), 10, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const order = await db.order.findUnique({ where: { id: params.orderId }, include: { shipment: true } });
  if (!order || order.orderType !== "proxy") return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  if (!verifyOrderLookup(order, { token: body.token })) return NextResponse.json({ error: "unauthorized" }, { status: 403 });

  const type = sanitizeText(body.type, 30) ?? "other";
  const userDescription = sanitizeText(body.userDescription, 600) ?? "";
  if (!userDescription) return NextResponse.json({ error: "description_required" }, { status: 400 });
  const evidenceList = Array.isArray(body.evidence) ? (body.evidence as Record<string, unknown>[]) : [];

  // Risk signals (advisory only)
  const since = new Date(Date.now() - DAY30);
  const refundsLast30d = order.customerPhone
    ? await db.order.count({ where: { customerPhone: order.customerPhone, refunds: { some: { createdAt: { gte: since } } } } })
    : 0;
  const missingClaimsCount = order.customerPhone
    ? await db.afterSalesCase.count({ where: { type: "missing", order: undefined, createdAt: { gte: since }, orderId: { in: (await db.order.findMany({ where: { customerPhone: order.customerPhone }, select: { id: true } })).map((o: { id: string }) => o.id) } } })
    : 0;
  const ordersByPhone = order.customerPhone ? await db.order.count({ where: { customerPhone: order.customerPhone } }) : 1;
  const delivered = order.shipment?.shippingStatus === "delivered" || order.status === "delivered";

  const risk = scoreAfterSalesRisk({
    refundsLast30d,
    missingClaimsCount,
    orderAmountCents: order.amount,
    isNewUser: ordersByPhone <= 1,
    hasEvidence: evidenceList.length > 0,
    deliveredButClaimsMissing: delivered && type === "missing",
  });

  const created = await db.afterSalesCase.create({
    data: {
      caseNo: caseNo(),
      orderId: order.id,
      userId: order.userId,
      type,
      status: evidenceList.length > 0 ? "reviewing" : "waiting_evidence",
      riskScore: risk.score,
      riskFlagsJson: JSON.stringify(risk.flags),
      userDescription,
      evidence: {
        create: evidenceList.slice(0, 10).map((e) => ({
          evidenceType: sanitizeText(e.evidenceType, 20) ?? "text",
          text: sanitizeText(e.text, 500),
          fileUrl: sanitizeText(e.fileUrl, 500),
          uploadedBy: "user",
        })),
      },
    },
  });

  await recordOrderEvent({
    orderId: order.id,
    eventType: "after_sales_opened",
    title: "用户发起售后",
    message: type,
    metadata: { caseNo: created.caseNo, riskScore: risk.score },
  });

  if (canTransition(order.status as OrderStatus, "after_sales")) {
    await transitionOrderStatus({ orderId: order.id, to: "after_sales", eventType: "after_sales", message: "进入售后" }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true, caseNo: created.caseNo, status: created.status });
}
