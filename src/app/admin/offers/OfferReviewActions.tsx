"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

const STATUS_VALUES = ["approved", "needs_review", "rejected", "pending"] as const;

export default function OfferReviewActions({
  offerId,
  currentStatus,
}: {
  offerId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const { locale } = useLang();
  const statusLabels: Record<string, string> = {
    approved: pick(locale, "通过", "Approve"),
    needs_review: pick(locale, "复核", "Re-review"),
    rejected: pick(locale, "拒绝", "Reject"),
    pending: pick(locale, "待定", "Pending"),
  };
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  const update = async (reviewStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || pick(locale, "更新失败", "Update failed"));
      }
      setStatus(reviewStatus);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {STATUS_VALUES.map((value) => (
        <button
          key={value}
          type="button"
          disabled={loading || status === value}
          onClick={() => update(value)}
          className={status === value ? "btn-primary text-xs" : "btn-secondary text-xs"}
        >
          {statusLabels[value]}
        </button>
      ))}
    </div>
  );
}
