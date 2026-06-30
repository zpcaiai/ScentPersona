import { db } from "@/lib/db";

interface PaymentAmounts {
  amountCents: number;
  refundedAmountCents: number;
}

/** Sum of captured vs already-refunded amounts for an order's primary payments. */
export async function getRefundableCents(orderId: string): Promise<{
  paidCents: number;
  refundedCents: number;
  remainingCents: number;
}> {
  const payments = (await db.orderPayment.findMany({
    where: { orderId, purpose: "order", status: "paid" },
  })) as PaymentAmounts[];
  const paidCents = payments.reduce((s: number, p: PaymentAmounts) => s + p.amountCents, 0);
  const refundedCents = payments.reduce(
    (s: number, p: PaymentAmounts) => s + p.refundedAmountCents,
    0
  );
  return { paidCents, refundedCents, remainingCents: Math.max(0, paidCents - refundedCents) };
}
