import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream for WeChat payment status — replaces client polling
 * with a single server-pushed connection.
 * NOTE: raw WebSocket needs a persistent (non-serverless) server; SSE is the
 * push transport that works on this Next.js/Vercel target. For true cross-
 * instance push, publish payment events to Redis/Pusher from the webhook and
 * subscribe here instead of the server-side DB check.
 */
export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get("orderId");
  if (!orderId) return new Response("missing orderId", { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        try { controller.close(); } catch { /* already closed */ }
      };

      send("open", { ok: true });
      const startedAt = Date.now();
      const timer = setInterval(async () => {
        if (closed) return;
        try {
          const p = await db.orderPayment.findFirst({
            where: { orderId, provider: "wechat" },
            orderBy: { createdAt: "desc" },
            select: { status: true },
          });
          if (p?.status === "paid") { send("paid", { paid: true }); cleanup(); }
          else if (p?.status === "failed") { send("failed", { paid: false }); cleanup(); }
          else if (Date.now() - startedAt > 5 * 60 * 1000) { send("timeout", { paid: false }); cleanup(); }
          else send("ping", { t: Date.now() });
        } catch { /* transient DB error — keep the stream open */ }
      }, 2500);

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
