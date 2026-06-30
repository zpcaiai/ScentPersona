import crypto from "crypto";
import type {
  CreateCheckoutSessionInput, CreateCheckoutSessionOutput, PaymentProvider,
  RawWebhook, RefundInput, RefundOutput, WebhookVerifyResult,
} from "./types";

/**
 * Alipay (RSA2 / alipay.trade.page.pay). Faithful implementation; requires real
 * app credentials + Alipay public key. Keys from env only.
 * Docs: https://opendocs.alipay.com/open/270/105898
 */
function cfg() {
  const pem = (v?: string) => (v || "").replace(/\\n/g, "\n");
  return {
    appId: process.env.ALIPAY_APP_ID || "",
    privateKey: pem(process.env.ALIPAY_PRIVATE_KEY),
    alipayPublicKey: pem(process.env.ALIPAY_PUBLIC_KEY),
    gateway: process.env.ALIPAY_GATEWAY || "https://openapi.alipay.com/gateway.do",
    notifyUrl: process.env.ALIPAY_NOTIFY_URL || `${process.env.APP_URL || ""}/api/payments/webhook/alipay`,
    returnUrl: process.env.ALIPAY_RETURN_URL || process.env.APP_URL || "",
  };
}
function isCfg(c: ReturnType<typeof cfg>) { return Boolean(c.appId && c.privateKey); }

function cnTimestamp(): string {
  const d = new Date(Date.now() + 8 * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}
function signContent(params: Record<string, string>): string {
  return Object.keys(params)
    .filter((k) => k !== "sign" && params[k] !== undefined && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
}
function buildRequest(method: string, bizContent: Record<string, unknown>, c: ReturnType<typeof cfg>, extra: Record<string, string> = {}): Record<string, string> {
  const params: Record<string, string> = {
    app_id: c.appId, method, format: "JSON", charset: "utf-8", sign_type: "RSA2",
    timestamp: cnTimestamp(), version: "1.0", biz_content: JSON.stringify(bizContent), ...extra,
  };
  params.sign = crypto.createSign("RSA-SHA256").update(signContent(params), "utf8").sign(c.privateKey, "base64");
  return params;
}

export const alipayProvider: PaymentProvider = {
  providerName: "alipay",
  isConfigured() { return isCfg(cfg()); },

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionOutput> {
    const c = cfg();
    if (!isCfg(c)) throw new Error("alipay_not_configured");
    const outTradeNo = input.metadata?.paymentId || input.orderNo;
    const params = buildRequest(
      "alipay.trade.page.pay",
      { out_trade_no: outTradeNo, total_amount: (input.amountCents / 100).toFixed(2), subject: (input.description || "ScentPersona").slice(0, 256), product_code: "FAST_INSTANT_TRADE_PAY" },
      c,
      { notify_url: c.notifyUrl, return_url: input.successUrl || c.returnUrl }
    );
    const query = Object.keys(params).map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join("&");
    return { provider: "alipay", providerPaymentId: outTradeNo, checkoutUrl: `${c.gateway}?${query}`, status: "created" };
  },

  async verifyWebhook(raw: RawWebhook): Promise<WebhookVerifyResult> {
    const c = cfg();
    const params: Record<string, string> = {};
    new URLSearchParams(raw.body).forEach((v, k) => { params[k] = v; });
    const sign = params.sign;
    if (!sign) return { ok: false, reason: "no_sign" };
    delete params.sign; delete params.sign_type;
    try {
      const ok = c.alipayPublicKey && crypto.createVerify("RSA-SHA256").update(signContent(params), "utf8").verify(c.alipayPublicKey, sign, "base64");
      if (!ok) return { ok: false, reason: "bad_signature" };
      const paid = params.trade_status === "TRADE_SUCCESS" || params.trade_status === "TRADE_FINISHED";
      return {
        ok: true,
        event: { type: "alipay.notify", providerPaymentId: params.out_trade_no, amountCents: Math.round(parseFloat(params.total_amount || "0") * 100), status: paid ? "paid" : "failed", raw: params },
      };
    } catch (err) {
      return { ok: false, reason: err instanceof Error ? err.message : "verify_error" };
    }
  },

  async refund(input: RefundInput): Promise<RefundOutput> {
    const c = cfg();
    if (!isCfg(c)) throw new Error("alipay_not_configured");
    const params = buildRequest("alipay.trade.refund", { out_trade_no: input.providerPaymentId, refund_amount: (input.amountCents / 100).toFixed(2), refund_reason: input.reason.slice(0, 256) }, c);
    const res = await fetch(c.gateway, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" }, body: new URLSearchParams(params).toString() });
    const text = await res.text();
    let resp: { code?: string; trade_no?: string } = {};
    try { resp = (JSON.parse(text) as Record<string, { code?: string; trade_no?: string }>)["alipay_trade_refund_response"] ?? {}; } catch { /* */ }
    if (resp.code && resp.code !== "10000") throw new Error(`alipay_refund_failed:${resp.code}`);
    return { provider: "alipay", providerRefundId: resp.trade_no ?? "", status: "refunded" };
  },

  async getPaymentStatus(providerPaymentId: string): Promise<string> {
    const c = cfg();
    if (!isCfg(c)) return "unknown";
    const params = buildRequest("alipay.trade.query", { out_trade_no: providerPaymentId }, c);
    const res = await fetch(c.gateway, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" }, body: new URLSearchParams(params).toString() });
    const text = await res.text();
    try {
      const resp = (JSON.parse(text) as Record<string, { trade_status?: string }>)["alipay_trade_query_response"] ?? {};
      return resp.trade_status === "TRADE_SUCCESS" || resp.trade_status === "TRADE_FINISHED" ? "paid" : (resp.trade_status?.toLowerCase() ?? "unknown");
    } catch { return "unknown"; }
  },
};
