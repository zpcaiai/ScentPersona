import crypto from "crypto";

const XHS_APP_ID = process.env.XHS_APP_ID || "";
const XHS_APP_SECRET = process.env.XHS_APP_SECRET || "";
const XHS_MERCHANT_ID = process.env.XHS_MERCHANT_ID || "";
const XHS_NOTIFY_URL = process.env.XHS_NOTIFY_URL || "";

function generateSignature(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");
  return crypto
    .createHmac("sha256", XHS_APP_SECRET)
    .update(signStr)
    .digest("hex");
}

export interface XhsPrepayResult {
  tradeNo: string;
  paySign: string;
  timeStamp: string;
  nonceStr: string;
  signType: string;
}

export async function createXhsOrder(params: {
  orderNo: string;
  amount: number;
  description: string;
}): Promise<XhsPrepayResult> {
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString("hex");

  const signParams: Record<string, string> = {
    app_id: XHS_APP_ID,
    merchant_id: XHS_MERCHANT_ID,
    out_trade_no: params.orderNo,
    total_amount: params.amount.toString(),
    description: params.description,
    notify_url: XHS_NOTIFY_URL,
    timestamp: timeStamp,
    nonce: nonceStr,
  };

  const sign = generateSignature(signParams);

  const res = await fetch("https://pay.xiaohongshu.com/api/v1/order/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...signParams, sign }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`XHS Pay API error: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as { trade_no: string };
  const tradeNo = data.trade_no;

  const paySignParams: Record<string, string> = {
    app_id: XHS_APP_ID,
    trade_no: tradeNo,
    timestamp: timeStamp,
    nonce: nonceStr,
  };
  const paySign = generateSignature(paySignParams);

  return {
    tradeNo,
    paySign,
    timeStamp,
    nonceStr,
    signType: "HMAC-SHA256",
  };
}

export function verifyXhsCallback(params: Record<string, string>, sign: string): boolean {
  const expectedSign = generateSignature(params);
  const expected = Buffer.from(expectedSign);
  const provided = Buffer.from(sign);
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(expected, provided);
}

export function isXhsConfigured(): boolean {
  return !!(XHS_APP_ID && XHS_APP_SECRET && XHS_MERCHANT_ID);
}
