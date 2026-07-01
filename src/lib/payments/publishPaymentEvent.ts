/**
 * Publish a payment event to the standalone WebSocket server (self-hosted).
 * No-op when WS_PUBLISH_URL / WS_PUBLISH_SECRET aren't set (e.g. Vercel, where
 * the SSE endpoint is used instead). Best-effort — never breaks the webhook.
 */
export async function publishPaymentEvent(orderId: string, event: string, data?: Record<string, unknown>): Promise<void> {
  const url = process.env.WS_PUBLISH_URL;
  const secret = process.env.WS_PUBLISH_SECRET;
  if (!url || !secret) return;
  try {
    await fetch(`${url.replace(/\/$/, "")}/internal/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Publish-Secret": secret },
      body: JSON.stringify({ orderId, event, data: data ?? {} }),
    });
  } catch {
    /* best-effort */
  }
}
