import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientKey, normalizePhone, sanitizeText } from "@/lib/api-guards";
import { transitionOrderStatus, recordOrderEvent } from "@/lib/orders/transitionOrderStatus";
import { getActiveDocument } from "@/lib/legal/getActiveDocument";
import { proxyServiceAgreementFull } from "@/data/proxyOrderCopy";
import { assessOrderRiskSafe } from "@/lib/risk/assess";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  if (!rateLimit(getClientKey(request, "proxy-confirm"), 30, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const order = await db.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.orderType !== "proxy") {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }
  if (order.status !== "quoted") {
    return NextResponse.json({ error: "not_quotable", status: order.status }, { status: 409 });
  }
  if (order.quoteExpiresAt && order.quoteExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "quote_expired" }, { status: 410 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  if (body.agreementAccepted !== true) {
    return NextResponse.json({ error: "agreement_required" }, { status: 400 });
  }

  const recipientName = sanitizeText(body.recipientName, 40);
  const phone = normalizePhone(body.phone);
  const province = sanitizeText(body.province, 40);
  const city = sanitizeText(body.city, 40);
  const district = sanitizeText(body.district, 40);
  const addressLine1 = sanitizeText(body.addressLine1, 160);
  const addressLine2 = sanitizeText(body.addressLine2, 160);
  const postalCode = sanitizeText(body.postalCode, 12);

  if (!recipientName || !phone || !province || !city || !district || !addressLine1) {
    return NextResponse.json({ error: "address_incomplete" }, { status: 400 });
  }

  await db.orderAddress.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      recipientName,
      phone,
      province,
      city,
      district,
      addressLine1,
      addressLine2: addressLine2 ?? null,
      postalCode: postalCode ?? null,
    },
    update: {
      recipientName,
      phone,
      province,
      city,
      district,
      addressLine1,
      addressLine2: addressLine2 ?? null,
      postalCode: postalCode ?? null,
    },
  });

  await db.order.update({
    where: { id: order.id },
    data: { customerName: recipientName, customerPhone: phone },
  });

  await recordOrderEvent({
    orderId: order.id,
    eventType: "agreement_accepted",
    title: "用户已确认服务协议与收货信息",
    metadata: {
      version: sanitizeText(body.agreementVersion, 20) ?? "v1",
      ip: getClientKey(request, "ip"),
      ua: (request.headers.get("user-agent") ?? "").slice(0, 200),
    },
  });

  const agreementDoc = await getActiveDocument("proxy_order_agreement");
  await db.orderContractSnapshot.create({
    data: {
      orderId: order.id,
      legalDocumentType: "proxy_order_agreement",
      legalDocumentVersion: agreementDoc?.version ?? "builtin-v1",
      acceptedIp: getClientKey(request, "ip"),
      acceptedUserAgent: (request.headers.get("user-agent") ?? "").slice(0, 200),
      contentSnapshot: agreementDoc?.content ?? proxyServiceAgreementFull.join("\n"),
    },
  });

  await transitionOrderStatus({
    orderId: order.id,
    to: "awaiting_payment",
    expectedFrom: "quoted",
    eventType: "order_confirmed",
    message: "用户已确认收货信息",
  });

  assessOrderRiskSafe(order.id);
  return NextResponse.json({ ok: true, nextStatus: "awaiting_payment" });
}
