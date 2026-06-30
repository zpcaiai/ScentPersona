import { db } from "@/lib/db";
import { getPaymentProvider } from "./index";
import { recordOrderEvent, transitionOrderStatus } from "@/lib/orders/transitionOrderStatus";
import { recalcOrderProfitSafe } from "@/lib/finance/calculateOrderProfit";
import { notifyOrderSafe } from "@/lib/notifications/notifyOrder";

/**
 * Single source of truth for applying a payment provider callback.
 * Used by the real webhook route AND the mock PSP callback. Guarantees:
 * signature-verified, idempotent (no double processing), and amount-checked.
 */
export async function handlePaymentWebhook(
  providerName: string,
  rawBody: string,
  signature: string | null,
  headers?: Record<string, string>
): Promise<{ ok: boolean; status: string }> {
  const provider = getPaymentProvider(providerName);
  if (!provider) return { ok: false, status: "unknown_provider" };

  const result = await provider.verifyWebhook({ body: rawBody, signature, headers });
  if (!result.ok || !result.event) {
    return { ok: false, status: result.reason ?? "invalid_signature" };
  }
  const ev = result.event;

  const payment = await db.orderPayment.findFirst({
    where: { providerPaymentId: ev.providerPaymentId },
  });
  if (!payment) return { ok: false, status: "payment_not_found" };

  // Idempotency: a settled payment is never reprocessed.
  if (payment.status === "paid") return { ok: true, status: "already_paid" };

  if (ev.status !== "paid") {
    await db.orderPayment.update({
      where: { id: payment.id },
      data: { status: "failed", rawDataJson: JSON.stringify(ev.raw ?? {}) },
    });
    await recordOrderEvent({
      orderId: payment.orderId,
      eventType: "payment_failed",
      title: "支付未成功",
      message: ev.type,
    });
    return { ok: true, status: "failed" };
  }

  // Never trust the client: the callback amount must match what we charged.
  if (typeof ev.amountCents === "number" && ev.amountCents !== payment.amountCents) {
    await db.orderPayment.update({
      where: { id: payment.id },
      data: { status: "manual_review", rawDataJson: JSON.stringify(ev.raw ?? {}) },
    });
    await recordOrderEvent({
      orderId: payment.orderId,
      eventType: "payment_amount_mismatch",
      title: "支付金额不一致，需人工核实",
      message: `expected ${payment.amountCents} got ${ev.amountCents}`,
    });
    return { ok: true, status: "amount_mismatch" };
  }

  await db.$transaction(async (tx) => {
    await tx.orderPayment.update({
      where: { id: payment.id },
      data: { status: "paid", paidAt: new Date(), rawDataJson: JSON.stringify(ev.raw ?? {}) },
    });
    if (payment.purpose === "price_adjustment") {
      // Difference payment: resume sourcing rather than re-entering `paid`.
      await recordOrderEvent(
        { orderId: payment.orderId, eventType: "price_diff_paid", title: "差价已支付" },
        tx
      );
      await transitionOrderStatus(
        {
          orderId: payment.orderId,
          to: "purchasing",
          expectedFrom: ["price_changed"],
          eventType: "resume_purchasing",
          message: "用户已支付差价，继续采购",
        },
        tx
      ).catch(() => undefined);
    } else {
      await transitionOrderStatus(
        {
          orderId: payment.orderId,
          to: "paid",
          expectedFrom: ["awaiting_payment", "quoted"],
          eventType: "payment_success",
          message: "支付成功",
        },
        tx
      );
    }
  });

  recalcOrderProfitSafe(payment.orderId);
  notifyOrderSafe(payment.orderId, "payment_success");
  return { ok: true, status: "paid" };
}
