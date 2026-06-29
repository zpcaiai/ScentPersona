"use client";

import { useState } from "react";

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "待支付" },
  { value: "paid", label: "已支付" },
  { value: "processing", label: "备货中" },
  { value: "shipped", label: "已发货" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
  { value: "refunded", label: "已退款" },
];

export default function AdminOrderActions({
  orderId,
  initialStatus,
  initialTrackingNumber,
}: {
  orderId: string;
  initialStatus: string;
  initialTrackingNumber: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [saving, setSaving] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, trackingNumber }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "保存失败");
      }

      setMessage("已保存");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const refund = async () => {
    setRefunding(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "后台退款" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "退款失败");
      }

      setStatus("refunded");
      setMessage("退款已处理");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "退款失败");
    } finally {
      setRefunding(false);
    }
  };

  return (
    <div className="mt-3 grid gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-lg border border-cream-200 bg-white px-3 py-2 text-xs text-stone-700"
      >
        {ORDER_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        placeholder="物流单号"
        className="rounded-lg border border-cream-200 bg-white px-3 py-2 text-xs text-stone-700"
      />
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="rounded-lg bg-sage-600 px-3 py-2 text-xs font-medium text-cream-50 disabled:opacity-50"
      >
        {saving ? "保存中..." : "保存订单状态"}
      </button>
      <button
        type="button"
        onClick={refund}
        disabled={refunding || status === "pending" || status === "cancelled" || status === "refunded"}
        className="rounded-lg border border-clay-400 px-3 py-2 text-xs font-medium text-clay-600 disabled:opacity-50"
      >
        {refunding ? "退款中..." : "发起退款"}
      </button>
      {message && <div className="text-xs text-stone-500">{message}</div>}
    </div>
  );
}
