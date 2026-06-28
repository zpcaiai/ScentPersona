import crypto from "crypto";

const WECHAT_APPID = process.env.WECHAT_APPID || "";
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET || "";
const WECHAT_MCHID = process.env.WECHAT_MCHID || "";
const WECHAT_SERIAL_NO = process.env.WECHAT_SERIAL_NO || "";
const WECHAT_PRIVATE_KEY = process.env.WECHAT_PRIVATE_KEY || "";
const WECHAT_APIV3_KEY = process.env.WECHAT_APIV3_KEY || "";
const WECHAT_NOTIFY_URL = process.env.WECHAT_NOTIFY_URL || "";
const WECHAT_PLATFORM_PUBLIC_KEY = process.env.WECHAT_PLATFORM_PUBLIC_KEY || "";

function getPrivateKey(): crypto.KeyObject {
  const pem = WECHAT_PRIVATE_KEY.replace(/\\n/g, "\n");
  return crypto.createPrivateKey(pem);
}

function buildAuthorization(method: string, url: string, body: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");
  const message = `${method}\n${url}\n${timestamp}\n${nonce}\n${body}\n`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(message)
    .sign(getPrivateKey())
    .toString("base64");
  return `WECHATPAY2-SHA256-RSA2048 mchid="${WECHAT_MCHID}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${WECHAT_SERIAL_NO}",signature="${signature}"`;
}

export interface WechatPrepayResult {
  prepayId: string;
  paySign: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
}

export interface WechatNativePayResult {
  codeUrl: string;
}

export async function createWechatJsapiOrder(params: {
  orderNo: string;
  amount: number;
  description: string;
  openid: string;
}): Promise<WechatPrepayResult> {
  const apiUrl = "/v3/pay/transactions/jsapi";
  const fullUrl = `https://api.mch.weixin.qq.com${apiUrl}`;
  const body = JSON.stringify({
    appid: WECHAT_APPID,
    mchid: WECHAT_MCHID,
    description: params.description,
    out_trade_no: params.orderNo,
    notify_url: WECHAT_NOTIFY_URL,
    amount: { total: params.amount, currency: "CNY" },
    payer: { openid: params.openid },
  });

  const auth = buildAuthorization("POST", apiUrl, body);
  const res = await fetch(fullUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
      Accept: "application/json",
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`WeChat Pay API error: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as { prepay_id: string };
  const prepayId = data.prepay_id;

  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString("hex");
  const packageStr = `prepay_id=${prepayId}`;
  const paySignMessage = `${WECHAT_APPID}\n${timeStamp}\n${nonceStr}\n${packageStr}\n`;
  const paySign = crypto
    .createSign("RSA-SHA256")
    .update(paySignMessage)
    .sign(getPrivateKey())
    .toString("base64");

  return {
    prepayId,
    paySign,
    timeStamp,
    nonceStr,
    package: packageStr,
    signType: "RSA",
  };
}

export async function exchangeWechatLoginCode(code: string): Promise<{
  openid: string;
  sessionKey?: string;
}> {
  if (!WECHAT_APPID || !WECHAT_APP_SECRET) {
    throw new Error("WeChat login is not configured");
  }

  const url = new URL("https://api.weixin.qq.com/sns/jscode2session");
  url.searchParams.set("appid", WECHAT_APPID);
  url.searchParams.set("secret", WECHAT_APP_SECRET);
  url.searchParams.set("js_code", code);
  url.searchParams.set("grant_type", "authorization_code");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`WeChat login API error: ${res.status}`);
  }

  const data = (await res.json()) as {
    openid?: string;
    session_key?: string;
    errcode?: number;
    errmsg?: string;
  };

  if (!data.openid) {
    throw new Error(data.errmsg || `WeChat login failed: ${data.errcode ?? "unknown"}`);
  }

  return {
    openid: data.openid,
    sessionKey: data.session_key,
  };
}

export async function createWechatNativeOrder(params: {
  orderNo: string;
  amount: number;
  description: string;
}): Promise<WechatNativePayResult> {
  const apiUrl = "/v3/pay/transactions/native";
  const fullUrl = `https://api.mch.weixin.qq.com${apiUrl}`;
  const body = JSON.stringify({
    appid: WECHAT_APPID,
    mchid: WECHAT_MCHID,
    description: params.description,
    out_trade_no: params.orderNo,
    notify_url: WECHAT_NOTIFY_URL,
    amount: { total: params.amount, currency: "CNY" },
  });

  const auth = buildAuthorization("POST", apiUrl, body);
  const res = await fetch(fullUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
      Accept: "application/json",
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`WeChat Pay Native API error: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as { code_url: string };
  return { codeUrl: data.code_url };
}

export async function queryWechatOrderByOutTradeNo(orderNo: string): Promise<{
  tradeState: string;
  transactionId?: string;
  amount?: number;
  mchid?: string;
  successTime?: string;
}> {
  const apiUrl = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(orderNo)}?mchid=${encodeURIComponent(WECHAT_MCHID)}`;
  const fullUrl = `https://api.mch.weixin.qq.com${apiUrl}`;
  const auth = buildAuthorization("GET", apiUrl, "");

  const res = await fetch(fullUrl, {
    method: "GET",
    headers: {
      Authorization: auth,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`WeChat Pay query error: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as {
    trade_state: string;
    transaction_id?: string;
    amount?: { total?: number };
    mchid?: string;
    success_time?: string;
  };

  return {
    tradeState: data.trade_state,
    transactionId: data.transaction_id,
    amount: data.amount?.total,
    mchid: data.mchid,
    successTime: data.success_time,
  };
}

export function verifyWechatCallback(
  timestamp: string,
  nonce: string,
  body: string,
  signature: string
): boolean {
  if (!WECHAT_PLATFORM_PUBLIC_KEY) return false;

  const message = `${timestamp}\n${nonce}\n${body}\n`;
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(message);
  const publicKey = WECHAT_PLATFORM_PUBLIC_KEY.replace(/\\n/g, "\n");
  return verifier.verify(publicKey, signature, "base64");
}

export function decryptWechatResource(
  ciphertext: string,
  nonce: string,
  associatedData: string
): Record<string, unknown> {
  const key = Buffer.from(WECHAT_APIV3_KEY, "utf-8");
  const ciphertextBuf = Buffer.from(ciphertext, "base64");
  const authTag = ciphertextBuf.subarray(ciphertextBuf.length - 16);
  const encryptedData = ciphertextBuf.subarray(0, ciphertextBuf.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(nonce, "utf-8"));
  decipher.setAuthTag(authTag);
  decipher.setAAD(Buffer.from(associatedData, "utf-8"));
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  return JSON.parse(decrypted.toString("utf-8"));
}

export function isWechatConfigured(): boolean {
  return !!(WECHAT_APPID && WECHAT_MCHID && WECHAT_PRIVATE_KEY && WECHAT_APIV3_KEY);
}

export function getWechatMerchantId(): string {
  return WECHAT_MCHID;
}
