"use client";

import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

async function recordProductEvent(input: {
  productId: string;
  productOfferId: string;
  eventType: string;
}) {
  await fetch("/api/events/product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).catch(() => undefined);
}

export default function OfferOutboundLink({
  productId,
  offerId,
  href,
}: {
  productId: string;
  offerId: string;
  href: string;
}) {
  const { locale } = useLang();
  return (
    <a
      href={href}
      className="btn-primary mt-3 inline-flex"
      target="_blank"
      rel="noreferrer"
      onClick={() => recordProductEvent({ productId, productOfferId: offerId, eventType: "outbound_click" })}
    >
      {pick(locale, "去平台看看", "View on the platform")}
    </a>
  );
}
