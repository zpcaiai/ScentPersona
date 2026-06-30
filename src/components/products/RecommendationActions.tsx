"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

async function recordProductEvent(input: {
  sessionId?: string;
  productId: string;
  productOfferId?: string;
  eventType: string;
  eventValue?: Record<string, unknown>;
}) {
  await fetch("/api/events/product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).catch(() => undefined);
}

export default function RecommendationActions({
  sessionId,
  productId,
  productOfferId,
  offersHref,
  outboundHref,
}: {
  sessionId: string;
  productId: string;
  productOfferId?: string;
  offersHref: string;
  outboundHref?: string | null;
}) {
  const { locale } = useLang();
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    recordProductEvent({ sessionId, productId, productOfferId, eventType: "view" });
  }, [sessionId, productId, productOfferId]);

  const markDislike = async () => {
    await recordProductEvent({ sessionId, productId, productOfferId, eventType: "dislike" });
    setFeedback(pick(locale, "已记录", "Noted"));
  };

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <Link
        href={offersHref}
        className="btn-secondary"
        onClick={() => recordProductEvent({ sessionId, productId, productOfferId, eventType: "click_offer" })}
      >
        {pick(locale, "查看更多平台价格", "Compare more prices")}
      </Link>
      {outboundHref && (
        <a
          href={outboundHref}
          target="_blank"
          rel="noreferrer"
          className="btn-primary"
          onClick={() => recordProductEvent({ sessionId, productId, productOfferId, eventType: "outbound_click" })}
        >
          {pick(locale, "去平台看看", "View on the platform")}
        </a>
      )}
      <button type="button" className="btn-secondary" onClick={markDislike}>
        {feedback || pick(locale, "不喜欢这个推荐", "Not a fan of this pick")}
      </button>
    </div>
  );
}
