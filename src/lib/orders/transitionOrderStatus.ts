import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  type OrderStatus,
  STATUS_EVENT_TITLE,
  canTransition,
  isOrderStatus,
} from "./orderStatus";

export class OrderTransitionError extends Error {
  code: string;
  constructor(message: string, code = "INVALID_TRANSITION") {
    super(message);
    this.name = "OrderTransitionError";
    this.code = code;
  }
}

type DbClient = typeof db | Prisma.TransactionClient;

/** Target statuses that stamp a timestamp column on the order. */
const STATUS_TIMESTAMP: Partial<
  Record<OrderStatus, "paidAt" | "shippedAt" | "completedAt" | "cancelledAt" | "refundedAt">
> = {
  paid: "paidAt",
  shipped: "shippedAt",
  delivered: "completedAt",
  cancelled: "cancelledAt",
  refunded: "refundedAt",
};

export interface TransitionInput {
  orderId: string;
  to: OrderStatus;
  /** Optimistic guard: reject if current status is not one of these. */
  expectedFrom?: OrderStatus | OrderStatus[];
  operatorId?: string | null;
  reason?: string;
  eventType?: string;
  title?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * The ONLY supported way to change a proxy order's status. Validates the
 * transition, stamps lifecycle timestamps, and writes an auditable OrderEvent.
 */
export async function transitionOrderStatus(input: TransitionInput, client: DbClient = db) {
  const order = await client.order.findUnique({ where: { id: input.orderId } });
  if (!order) {
    throw new OrderTransitionError(`Order not found: ${input.orderId}`, "NOT_FOUND");
  }

  const from = order.status;
  if (!isOrderStatus(from)) {
    throw new OrderTransitionError(
      `Order ${order.orderNo} status "${from}" is not managed by the proxy state machine`,
      "UNMANAGED_STATUS"
    );
  }

  if (input.expectedFrom) {
    const allowed = Array.isArray(input.expectedFrom) ? input.expectedFrom : [input.expectedFrom];
    if (!allowed.includes(from)) {
      throw new OrderTransitionError(
        `Order ${order.orderNo} expected status ${allowed.join("/")} but was ${from}`,
        "STALE_STATUS"
      );
    }
  }

  if (!canTransition(from, input.to)) {
    throw new OrderTransitionError(
      `Illegal transition ${from} -> ${input.to} for order ${order.orderNo}`
    );
  }

  const data: Prisma.OrderUpdateInput = { status: input.to };
  const tsField = STATUS_TIMESTAMP[input.to];
  if (tsField && !order[tsField]) {
    (data as Record<string, unknown>)[tsField] = new Date();
  }

  const updated = await client.order.update({ where: { id: order.id }, data });

  await client.orderEvent.create({
    data: {
      orderId: order.id,
      eventType: input.eventType ?? "status_change",
      fromStatus: from,
      toStatus: input.to,
      title: input.title ?? STATUS_EVENT_TITLE[input.to],
      message: input.message ?? input.reason ?? null,
      operatorId: input.operatorId ?? null,
      metadataJson: JSON.stringify(input.metadata ?? {}),
    },
  });

  return updated;
}

/** Append an order event WITHOUT changing status (payment created, address saved, …). */
export async function recordOrderEvent(
  params: {
    orderId: string;
    eventType: string;
    title: string;
    message?: string | null;
    operatorId?: string | null;
    metadata?: Record<string, unknown>;
  },
  client: DbClient = db
) {
  return client.orderEvent.create({
    data: {
      orderId: params.orderId,
      eventType: params.eventType,
      title: params.title,
      message: params.message ?? null,
      operatorId: params.operatorId ?? null,
      metadataJson: JSON.stringify(params.metadata ?? {}),
    },
  });
}
