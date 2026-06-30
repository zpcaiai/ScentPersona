import crypto from "crypto";
import type {
  CreateCheckoutSessionInput, CreateCheckoutSessionOutput, PaymentProvider,
  RawWebhook, RefundInput, RefundOutput, WebhookVerifyResult,
} from "./types";

/**
 * WeChat Pay v3 (Native). Faithful implementation; requires real merchant
 * credentials + the WeChat platform public key to run. Keys from env only.
 * Docs: https://pay.weixin.qq.com/docs/merchant/apis/native-payment/
 */
const BASE = "https://api.mch.weixin.qq.com";

function cfg() {
  const pem = (v?: string) => (v || "").replace(/\\n/g, "\n");
  return {
    appid: process.env.WECHAT_APPID || "",
    mchid: process.env.WECHAT_MCHID || "",
    serial: process.env.WECHAT_SERIAL_NO || "",
    privateKey: pem(process.env.WECHAT_PRIVATE_KEY),
    apiV3Key: process.env.WECHAT_APIV3_KEY || "",
    platformPublicKey: pem(process.env.WECHAT_PLATFORM_PUBLIC_KEY),
    notifyUrl: process.env.WECHAT_NOTIFY_URL || `${process.env.APP_URL || ""}/api/payments/webhook/wechat`,
  };
}
function isCfg(c: ReturnType<typeof cfg>) {
  return Boolean(c.appid && c.mchid && c.serial && c.privateKey && c.apiV3Key);
}

function authHeader(method: string, urlPath: string, body: string, c: ReturnType<typeof cfg>) {
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex").toUpperCase();
  const message = `${method}\n${urlPath}\n${ts}\n${nonce}\n${body}\n`;
  const signature = crypto.createSign("RSA-SHA256").update(message).sign(c.privateKey, "base64");
  return `WECHATPAY2-SHA256-RSA2048 mchid="${c.mchid}",nonce_str="${nonce}",timestamp="${ts}",serial_no="${c.serial}",signature="${signature}"`;
}

function decryptResource(apiV3Key: string, nonce: string, aad: string, ciphertextB64: string): string {
  const data = Buffer.from(ciphertextB64, "base64");
  const tag = data.subarray(data.length - 16);
  const enc = data.subarray(0, data.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(apiV3Key, "utf8"), Buffer.from(nonce, "utf8"));
  decipher.setAuthTag(tag);
  decipher.setAAD(Buffer.from(aad, "utf8"));
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

export const wechatPayProvider: PaymentProvider = {
  providerName: "wechat",
  isConfigured() { return isCfg(cfg()); },

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionOutput> {
    const c = cfg();
    if (!isCfg(c)) throw new Error("wechat_not_configured");
    const outTradeNo = input.metadata?.paymentId || input.orderNo;
    const path = "/v3/pay/transactions/native";
    const body = JSON.stringify({
      appid: c.appid, mchid: c.mchid,
      description: (input.description || "ScentPersona").slice(0, 127),
      out_trade_no: outTradeNo, notify_url: c.notifyUrl,
      amount: { total: input.amountCents, currency: "CNY" },
    });
    const res = await fetch(BASE + path, {
      method: "POST",
      headers: { Authorization: authHeader("POST", path, body, c), "Content-Type": "application/json", Accept: "application/json", "User-Agent": "ScentPersona/1.0" },
      body,
    });
    const json = (await res.json().catch(() => ({}))) as { code_url?: string; code?: string; message?: string };
    if (!res.ok || !json.code_url) throw new Error(`wechat_native_failed:${json.code || res.status}`);
    return { provider: "wechat", providerPaymentId: outTradeNo, checkoutUrl: `${process.env.APP_URL || ""}/pay/wechat/${input.orderId}`, clientSecret: json.code_url, status: "created" };
  },

  async verifyWebhook(raw: RawWebhook): Promise<WebhookVerifyResult> {
    const c = cfg();
    const h = raw.headers ?? {};
    const ts = h["wechatpay-timestamp"]; const nonce = h["wechatpay-nonce"]; const sig = h["wechatpay-signature"];
    if (!ts || !nonce || !sig) return { ok: false, reason: "missing_wechat_headers" };
    const message = `${ts}\n${nonce}\n${raw.body}\n`;
    try {
      if (!c.platformPublicKey || !crypto.createVerify("RSA-SHA256").update(message).verify(c.platformPublicKey, sig, "base64")) {
        return { ok: false, reason: "bad_signature" };
      }
      const body = JSON.parse(raw.body) as { event_type?: string; resource?: { ciphertext: string; nonce: string; associated_data: string } };
      if (!body.resource) return { ok: false, reason: "no_resource" };
      const plain = decryptResource(c.apiV3Key, body.resource.nonce, body.resource.associated_data, body.resource.ciphertext);
      const data = JSON.parse(plain) as { out_trade_no: string; transaction_id?: string; trade_state?: string; amount?: { total?: number } };
      return {
        ok: true,
        event: { type: body.event_type ?? "TRANSACTION", providerPaymentId: data.out_trade_no, amountCents: data.amount?.total, status: data.trade_state === "SUCCESS" ? "paid" : "failed", raw: data },
      };
    } catch (err) {
      return { ok: false, reason: err instanceof Error ? err.message : "verify_error" };
    }
  },

  async refund(input: RefundInput): Promise<RefundOutput> {
    const c = cfg();
    if (!isCfg(c)) throw new Error("wechat_not_configured");
    const path = "/v3/refund/domestic/refunds";
    const body = JSON.stringify({
      out_trade_no: input.providerPaymentId,
      out_refund_no: `RF${Date.now()}${crypto.randomBytes(2).toString("hex")}`,
      reason: input.reason.slice(0, 80),
      notify_url: c.notifyUrl,
      amount: { refund: input.amountCents, total: input.originalAmountCents ?? input.amountCents, currency: "CNY" },
    });
    const res = await fetch(BASE + path, {
      method: "POST",
      headers: { Authorization: authHeader("POST", path, body, c), "Content-Type": "application/json", Accept: "application/json", "User-Agent": "ScentPersona/1.0" },
      body,
    });
    const json = (await res.json().catch(() => ({}))) as { refund_id?: string; status?: string; code?: string };
    if (!res.ok) throw new Error(`wechat_refund_failed:${json.code || res.status}`);
    return { provider: "wechat", providerRefundId: json.refund_id ?? "", status: json.status === "SUCCESS" ? "refunded" : "processing" };
  },

  async getPaymentStatus(providerPaymentId: string): Promise<string> {
    const c = cfg();
    if (!isCfg(c)) return "unknown";
    const path = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(providerPaymentId)}?mchid=${c.mchid}`;
    const res = await fetch(BASE + path, { method: "GET", headers: { Authorization: authHeader("GET", path, "", c), Accept: "application/json", "User-Agent": "ScentPersona/1.0" } });
    const json = (await res.json().catch(() => ({}))) as { trade_state?: string };
    return json.trade_state === "SUCCESS" ? "paid" : (json.trade_state?.toLowerCase() ?? "unknown");
  },
};
