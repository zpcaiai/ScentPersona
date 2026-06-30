"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

export default function AdminOrderActions({
  orderId,
  initialStatus,
  initialTrackingNumber,
}: {
  orderId: string;
  initialStatus: string;
  initialTrackingNumber: string;
}) {
  const { locale } = useLang();
  const statusOptions = [
    { value: "pending", label: pick(locale, "待支付", "Pending payment") },
    { value: "paid", label: pick(locale, "已支付", "Paid") },
    { value: "processing", label: pick(locale, "备货中", "Preparing") },
    { value: "shipped", label: pick(locale, "已发货", "Shipped") },
    { value: "completed", label: pick(locale, "已完成", "Completed") },
    { value: "cancelled", label: pick(locale, "已取消", "Cancelled") },
    { value: "refunded", label: pick(locale, "已退款", "Refunded") },
  ];

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
        throw new Error(data.error || pick(locale, "保存失败", "Failed to save"));
      }

      setMessage(pick(locale, "已保存", "Saved"));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : pick(locale, "保存失败", "Failed to save"));
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
        throw new Error(data.error || pick(locale, "退款失败", "Refund failed"));
      }

      setStatus("refunded");
      setMessage(pick(locale, "退款已处理", "Refund processed"));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : pick(locale, "退款失败", "Refund failed"));
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
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        placeholder={pick(locale, "物流单号", "Tracking number")}
        className="rounded-lg border border-cream-200 bg-white px-3 py-2 text-xs text-stone-700"
      />
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="rounded-lg bg-sage-600 px-3 py-2 text-xs font-medium text-cream-50 disabled:opacity-50"
      >
        {saving ? pick(locale, "保存中...", "Saving...") : pick(locale, "保存订单状态", "Save order status")}
      </button>
      <button
        type="button"
        onClick={refund}
        disabled={refunding || status === "pending" || status === "cancelled" || status === "refunded"}
        className="rounded-lg border border-clay-400 px-3 py-2 text-xs font-medium text-clay-600 disabled:opacity-50"
      >
        {refunding ? pick(locale, "退款中...", "Refunding...") : pick(locale, "发起退款", "Issue refund")}
      </button>
      {message && <div className="text-xs text-stone-500">{message}</div>}
    </div>
  );
}
