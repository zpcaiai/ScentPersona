import type {
  CreateCheckoutSessionInput, CreateCheckoutSessionOutput, PaymentProvider,
  RawWebhook, RefundInput, RefundOutput, WebhookVerifyResult,
} from "./types";
import { createXhsOrder, verifyXhsCallback, isXhsConfigured } from "@/lib/xhs-pay";
import crypto from "crypto";

/**
 * 小红书小程序支付 provider. Mini-program only (no web checkout). The proxy
 * flow uses the dedicated /pay/xhs route to obtain requestPayment params;
 * this provider mainly serves webhook verification + refund. Keys from env.
 */
export const xhsPaymentProvider: PaymentProvider = {
  providerName: "xhs",
  isConfigured() { return isXhsConfigured(); },

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionOutput> {
    const outTradeNo = input.metadata?.paymentId || input.orderNo;
    const result = await createXhsOrder({ orderNo: outTradeNo, amount: input.amountCents, description: (input.description || "ScentPersona").slice(0, 127) });
    return { provider: "xhs", providerPaymentId: outTradeNo, clientSecret: JSON.stringify(result), status: "created" };
  },

  async verifyWebhook(raw: RawWebhook): Promise<WebhookVerifyResult> {
    try {
      const params = JSON.parse(raw.body) as Record<string, string>;
      const sign = params.sign;
      if (!sign) return { ok: false, reason: "no_sign" };
      const copy = { ...params };
      delete copy.sign;
      if (!verifyXhsCallback(copy, sign)) return { ok: false, reason: "bad_signature" };
      const tradeState = params.trade_status || params.status || "";
      const total = params.total_amount || params.amount || "0";
      return {
        ok: true,
        event: { type: "xhs.notify", providerPaymentId: params.out_trade_no, amountCents: parseInt(total, 10) || 0, status: tradeState.toUpperCase() === "SUCCESS" ? "paid" : "failed", raw: params },
      };
    } catch (err) {
      return { ok: false, reason: err instanceof Error ? err.message : "verify_error" };
    }
  },

  async refund(input: RefundInput): Promise<RefundOutput> {
    if (!isXhsConfigured()) throw new Error("xhs_not_configured");
    const params: Record<string, string> = {
      app_id: process.env.XHS_APP_ID || "",
      merchant_id: process.env.XHS_MERCHANT_ID || "",
      out_trade_no: input.providerPaymentId,
      out_refund_no: `RF${Date.now()}`,
      refund_amount: input.amountCents.toString(),
      reason: input.reason.slice(0, 80),
      timestamp: Math.floor(Date.now() / 1000).toString(),
      nonce: crypto.randomBytes(16).toString("hex"),
    };
    const signStr = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
    const sign = crypto.createHmac("sha256", process.env.XHS_APP_SECRET || "").update(signStr).digest("hex");
    const res = await fetch("https://pay.xiaohongshu.com/api/v1/order/refund", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...params, sign }),
    });
    const json = (await res.json().catch(() => ({}))) as { refund_no?: string; code?: string };
    if (!res.ok) throw new Error(`xhs_refund_failed:${json.code || res.status}`);
    return { provider: "xhs", providerRefundId: json.refund_no ?? "", status: "refunded" };
  },

  async getPaymentStatus(): Promise<string> {
    return "unknown"; // TODO: XHS order query endpoint
  },
};
