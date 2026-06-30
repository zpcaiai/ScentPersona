import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientKey } from "@/lib/api-guards";
import { mockSign } from "@/lib/payments/mockPaymentProvider";
import { handlePaymentWebhook } from "@/lib/payments/handleWebhook";

export const runtime = "nodejs";

/**
 * Simulates the mock PSP server. Builds a signed event for the order's pending
 * payment and routes it through the same idempotent webhook handler.
 * TODO(production): remove / disable when a real provider is configured.
 */
export async function POST(request: Request) {
  if (!rateLimit(getClientKey(request, "mock-pay"), 30, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const orderId = typeof body.orderId === "string" ? body.orderId : null;
  const outcome = body.outcome === "fail" ? "fail" : "success";
  if (!orderId) return NextResponse.json({ error: "orderId_required" }, { status: 400 });

  const payment = await db.orderPayment.findFirst({
    where: { orderId, provider: "mock", status: { in: ["created", "pending"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!payment || !payment.providerPaymentId) {
    return NextResponse.json({ error: "no_pending_payment" }, { status: 404 });
  }

  const event = {
    type: outcome === "success" ? "payment.succeeded" : "payment.failed",
    providerPaymentId: payment.providerPaymentId,
    amountCents: payment.amountCents,
    status: outcome === "success" ? "paid" : "failed",
  };
  const rawBody = JSON.stringify(event);
  const signature = mockSign(rawBody);

  const result = await handlePaymentWebhook("mock", rawBody, signature);

  const order = await db.order.findUnique({ where: { id: orderId } });
  return NextResponse.json({
    ...result,
    orderNo: order?.orderNo,
    accessToken: order?.accessToken,
  });
}
