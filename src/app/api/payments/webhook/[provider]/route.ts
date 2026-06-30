import { NextResponse } from "next/server";
import { handlePaymentWebhook } from "@/lib/payments/handleWebhook";

export const runtime = "nodejs";

/** Canonical provider callback. Reads the RAW body so signatures verify, and
 * ACKs in each provider's expected format. */
export async function POST(request: Request, { params }: { params: { provider: string } }) {
  const rawBody = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  const signature =
    headers["x-mock-signature"] || headers["stripe-signature"] ||
    headers["wechatpay-signature"] || headers["x-signature"] || null;

  const res = await handlePaymentWebhook(params.provider, rawBody, signature, headers);

  // Provider-specific acknowledgements.
  if (params.provider === "alipay") {
    return new Response(res.ok ? "success" : "fail", { status: 200, headers: { "content-type": "text/plain" } });
  }
  if (params.provider === "wechat") {
    return NextResponse.json(
      res.ok ? { code: "SUCCESS" } : { code: "FAIL", message: res.status },
      { status: res.ok ? 200 : 400 }
    );
  }
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}
