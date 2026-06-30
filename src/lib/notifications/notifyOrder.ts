import { db } from "@/lib/db";
import { sendNotification } from "./sendNotification";

/** Convenience: build standard order data and fire an in-app notification. */
export function notifyOrderSafe(orderId: string, type: string, extra?: Record<string, string | number>): void {
  (async () => {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return;
    await sendNotification({
      type,
      userId: order.userId,
      sessionId: order.sessionId,
      orderId: order.id,
      data: {
        orderNo: order.orderNo,
        productTitle: order.productTitle ?? "",
        amount: ((order.finalTotalCents ?? order.amount) / 100).toFixed(2),
        ...extra,
      },
    });
  })().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[notify] notifyOrder failed", orderId, type, err);
  });
}
