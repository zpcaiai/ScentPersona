import crypto from "crypto";

/** WeChat Pay v3 JSAPI (mini-program) + H5 helpers. Keys from env only. */
const BASE = "https://api.mch.weixin.qq.com";

function cfg() {
  const pem = (v?: string) => (v || "").replace(/\\n/g, "\n");
  return {
    appid: process.env.WECHAT_APPID || "",
    mchid: process.env.WECHAT_MCHID || "",
    serial: process.env.WECHAT_SERIAL_NO || "",
    privateKey: pem(process.env.WECHAT_PRIVATE_KEY),
    notifyUrl: process.env.WECHAT_NOTIFY_URL || `${process.env.APP_URL || ""}/api/payments/webhook/wechat`,
  };
}
function isCfg(c: ReturnType<typeof cfg>) {
  return Boolean(c.appid && c.mchid && c.serial && c.privateKey);
}
function authHeader(method: string, urlPath: string, body: string, c: ReturnType<typeof cfg>) {
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex").toUpperCase();
  const message = `${method}\n${urlPath}\n${ts}\n${nonce}\n${body}\n`;
  const signature = crypto.createSign("RSA-SHA256").update(message).sign(c.privateKey, "base64");
  return `WECHATPAY2-SHA256-RSA2048 mchid="${c.mchid}",nonce_str="${nonce}",timestamp="${ts}",serial_no="${c.serial}",signature="${signature}"`;
}

export function wechatConfigured(): boolean {
  return isCfg(cfg());
}

/** JSAPI prepay → prepay_id (mini-program / official-account). */
export async function createJsapiPrepay(input: { outTradeNo: string; amountCents: number; description: string; openid: string }): Promise<{ prepayId: string }> {
  const c = cfg();
  if (!isCfg(c)) throw new Error("wechat_not_configured");
  const path = "/v3/pay/transactions/jsapi";
  const body = JSON.stringify({
    appid: c.appid, mchid: c.mchid, description: input.description.slice(0, 127),
    out_trade_no: input.outTradeNo, notify_url: c.notifyUrl,
    amount: { total: input.amountCents, currency: "CNY" }, payer: { openid: input.openid },
  });
  const res = await fetch(BASE + path, { method: "POST", headers: { Authorization: authHeader("POST", path, body, c), "Content-Type": "application/json", Accept: "application/json", "User-Agent": "ScentPersona/1.0" }, body });
  const json = (await res.json().catch(() => ({}))) as { prepay_id?: string; code?: string };
  if (!res.ok || !json.prepay_id) throw new Error(`wechat_jsapi_failed:${json.code || res.status}`);
  return { prepayId: json.prepay_id };
}

/** Build the params the mini-program passes to wx.requestPayment / Taro.requestPayment. */
export function buildJsapiParams(prepayId: string) {
  const c = cfg();
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");
  const pkg = `prepay_id=${prepayId}`;
  const message = `${c.appid}\n${ts}\n${nonce}\n${pkg}\n`;
  const paySign = crypto.createSign("RSA-SHA256").update(message).sign(c.privateKey, "base64");
  return { appId: c.appid, timeStamp: ts, nonceStr: nonce, package: pkg, signType: "RSA", paySign };
}

/** H5 pay → h5_url (mobile web outside WeChat). */
export async function createH5(input: { outTradeNo: string; amountCents: number; description: string; clientIp: string }): Promise<{ h5Url: string }> {
  const c = cfg();
  if (!isCfg(c)) throw new Error("wechat_not_configured");
  const path = "/v3/pay/transactions/h5";
  const body = JSON.stringify({
    appid: c.appid, mchid: c.mchid, description: input.description.slice(0, 127),
    out_trade_no: input.outTradeNo, notify_url: c.notifyUrl,
    amount: { total: input.amountCents, currency: "CNY" },
    scene_info: { payer_client_ip: input.clientIp || "127.0.0.1", h5_info: { type: "Wap" } },
  });
  const res = await fetch(BASE + path, { method: "POST", headers: { Authorization: authHeader("POST", path, body, c), "Content-Type": "application/json", Accept: "application/json", "User-Agent": "ScentPersona/1.0" }, body });
  const json = (await res.json().catch(() => ({}))) as { h5_url?: string; code?: string };
  if (!res.ok || !json.h5_url) throw new Error(`wechat_h5_failed:${json.code || res.status}`);
  return { h5Url: json.h5_url };
}
