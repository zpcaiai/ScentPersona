import { describe, it, expect } from "vitest";
import {
  ORDER_STATUSES,
  canTransition,
  getAllowedNextStatuses,
  isOrderStatus,
  isTerminalStatus,
} from "../../src/lib/orders/orderStatus";

describe("order state machine", () => {
  it("recognizes the full proxy status set", () => {
    expect(ORDER_STATUSES).toContain("draft");
    expect(ORDER_STATUSES).toContain("refunded");
    expect(isOrderStatus("paid")).toBe(true);
    expect(isOrderStatus("pending")).toBe(false); // legacy sample-kit status
    expect(isOrderStatus("nonsense")).toBe(false);
  });

  it("allows the happy-path forward transitions", () => {
    const path: [string, string][] = [
      ["draft", "quoted"],
      ["quoted", "awaiting_payment"],
      ["awaiting_payment", "paid"],
      ["paid", "purchasing"],
      ["purchasing", "purchased"],
      ["purchased", "awaiting_shipment"],
      ["awaiting_shipment", "shipped"],
      ["shipped", "delivered"],
    ];
    for (const [from, to] of path) {
      expect(canTransition(from as never, to as never)).toBe(true);
    }
  });

  it("rejects illegal jumps", () => {
    expect(canTransition("draft", "paid")).toBe(false);
    expect(canTransition("paid", "shipped")).toBe(false);
    expect(canTransition("delivered", "paid")).toBe(false);
    expect(canTransition("paid", "paid")).toBe(false); // same-state
  });

  it("handles price_changed / out_of_stock resume to purchasing", () => {
    expect(canTransition("purchasing", "price_changed")).toBe(true);
    expect(canTransition("price_changed", "purchasing")).toBe(true);
    expect(canTransition("purchasing", "out_of_stock")).toBe(true);
    expect(canTransition("out_of_stock", "purchasing")).toBe(true);
  });

  it("only allows cancellation before goods are sourced/shipped", () => {
    expect(canTransition("paid", "cancelled")).toBe(true);
    expect(canTransition("quoted", "cancelled")).toBe(true);
    expect(canTransition("shipped", "cancelled")).toBe(false);
    expect(canTransition("delivered", "cancelled")).toBe(false);
  });

  it("opens refund flow only after payment is captured", () => {
    expect(canTransition("paid", "refund_pending")).toBe(true);
    expect(canTransition("shipped", "refund_pending")).toBe(true);
    expect(canTransition("draft", "refund_pending")).toBe(false);
    expect(canTransition("refund_pending", "refunded")).toBe(true);
  });

  it("treats failed as an admin escape hatch but keeps terminals terminal", () => {
    expect(canTransition("paid", "failed")).toBe(true);
    expect(canTransition("purchasing", "failed")).toBe(true);
    expect(canTransition("refunded", "failed")).toBe(false);
    expect(canTransition("cancelled", "failed")).toBe(false);
    expect(isTerminalStatus("refunded")).toBe(true);
    expect(getAllowedNextStatuses("cancelled")).toHaveLength(0);
  });
});
