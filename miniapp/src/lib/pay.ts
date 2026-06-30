import Taro from "@tarojs/taro";
import { loginWechat, requestWechatPay, requestXhsPay } from "./request";
import { pick, type Locale } from "./i18n";

/** Resolve (and cache) the WeChat openid via code2session. */
export async function resolveOpenid(): Promise<string> {
  let openid = Taro.getStorageSync("openid") || "";
  if (!openid) {
    const loginRes = await Taro.login();
    const authRes = await loginWechat(loginRes.code);
    openid = authRes.openid;
    Taro.setStorageSync("openid", openid);
  }
  return openid;
}

/** WeChat Mini Program JSAPI payment. */
export async function payWechatOrder(
  orderId: string,
  accessToken: string,
  locale: Locale = "zh",
): Promise<void> {
  void locale;
  const openid = await resolveOpenid();
  const p = await requestWechatPay(orderId, accessToken, openid);
  await Taro.requestPayment({
    timeStamp: p.timeStamp,
    nonceStr: p.nonceStr,
    package: p.package,
    signType: (p.signType as "RSA") || "RSA",
    paySign: p.paySign,
  });
}

/**
 * 小红书小程序支付。
 * 优先调用平台原生 `xhs.requestPayment`（参数字段以小红书开放平台「交易/支付」官方文档为准），
 * 在不支持原生 API 的环境下回退到 `Taro.requestPayment`。
 * 注意：需先在小红书开放平台开通支付资质并在服务端配置密钥（见根目录 README「小红书支付」）。
 * 这里不再沿用微信的 signType:"RSA"，而是透传服务端返回的 signType（小红书为 HMAC-SHA256）。
 */
export async function payXhsOrder(
  orderId: string,
  accessToken: string,
  locale: Locale = "zh",
): Promise<void> {
  const p = await requestXhsPay(orderId, accessToken);
  const xhs = (globalThis as any).xhs;
  if (xhs && typeof xhs.requestPayment === "function") {
    await new Promise<void>((resolve, reject) => {
      xhs.requestPayment({
        ...p,
        success: () => resolve(),
        fail: (e: any) => reject(new Error(e?.errMsg || pick(locale, "支付失败", "Payment failed"))),
      });
    });
    return;
  }
  await (Taro as any).requestPayment({
    timeStamp: p.timeStamp,
    nonceStr: p.nonceStr,
    package: p.tradeNo,
    signType: p.signType,
    paySign: p.paySign,
  });
}

/** Dispatch payment by platform. */
export async function payOrder(
  platform: string,
  orderId: string,
  accessToken: string,
  locale: Locale = "zh",
): Promise<void> {
  if (platform === "xhs") return payXhsOrder(orderId, accessToken, locale);
  return payWechatOrder(orderId, accessToken, locale);
}
