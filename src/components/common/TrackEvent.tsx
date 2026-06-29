"use client";

import { useEffect } from "react";

type TrackEventPayload = {
  eventName: string;
  source?: string;
  path?: string;
  sessionId?: string | null;
  orderId?: string | null;
  personaId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export function trackEvent(payload: TrackEventPayload) {
  const body = JSON.stringify({
    source: "web",
    ...payload,
  });

  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/event", blob);
    return;
  }

  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export default function TrackEvent(props: TrackEventPayload) {
  const { eventName, path, sessionId, orderId, personaId, source, metadata } = props;

  useEffect(() => {
    trackEvent({ eventName, path, sessionId, orderId, personaId, source, metadata });
  }, [eventName, path, sessionId, orderId, personaId, source, metadata]);

  return null;
}
