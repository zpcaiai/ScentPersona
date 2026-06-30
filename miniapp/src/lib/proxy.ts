import { request } from "./request";

export interface ProxyOffer {
  id: string;
  platform: string;
  title: string;
  brand?: string | null;
  priceCents?: number | null;
  shopName?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  salesCount?: number | null;
  imageUrl?: string | null;
  sourceUrl: string;
}

function qs(params: Record<string, string | undefined>): string {
  return Object.entries(params)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
    .join("&");
}

export function proxySearch(q: string) {
  return request<{ offers: ProxyOffer[]; disclaimer: string }>({
    url: `/api/products/search?q=${encodeURIComponent(q)}`,
  });
}

export function proxyQuote(offerId: string, quantity = 1, sessionId?: string) {
  return request<{
    orderId: string;
    orderNo: string;
    accessToken: string;
    status: string;
    blocked: boolean;
    riskFlags: string[];
    quoteExpiresAt: string | null;
  }>({ url: "/api/proxy-orders/quote", method: "POST", data: { offerId, quantity, sessionId } });
}

export function proxyConfirm(orderId: string, data: Record<string, unknown>) {
  return request<{ ok: boolean; nextStatus: string }>({
    url: `/api/proxy-orders/${orderId}/confirm`,
    method: "POST",
    data,
  });
}

export function proxyPay(orderId: string) {
  return request<{ ok: boolean; checkoutUrl?: string; providerPaymentId?: string }>({
    url: `/api/proxy-orders/${orderId}/pay`,
    method: "POST",
    data: { provider: "mock" },
  });
}

// Demo only — production mini-programs complete payment via native WeChat / XHS pay.
export function proxyMockPay(orderId: string, outcome: "success" | "fail" = "success") {
  return request<{ ok: boolean; status: string; orderNo?: string; accessToken?: string }>({
    url: "/api/payments/mock",
    method: "POST",
    data: { orderId, outcome },
  });
}

export function proxyDetail(params: { id?: string; orderNo?: string; token?: string }) {
  return request<Record<string, unknown>>({
    url: `/api/proxy-orders/detail?${qs({ id: params.id, orderNo: params.orderNo, token: params.token })}`,
  });
}

export function proxyAction(orderId: string, path: string, body: Record<string, unknown>) {
  return request<Record<string, unknown>>({
    url: `/api/proxy-orders/${orderId}/${path}`,
    method: "POST",
    data: body,
  });
}

export function proxyPayWechat(orderId: string, openid: string) {
  return request<{
    mode: string;
    params?: { appId: string; timeStamp: string; nonceStr: string; package: string; signType: string; paySign: string };
    h5Url?: string;
  }>({ url: `/api/proxy-orders/${orderId}/pay/wechat`, method: "POST", data: { mode: "jsapi", openid } });
}

export function proxyPayXhs(orderId: string) {
  return request<{
    ok: boolean;
    params?: { tradeNo: string; paySign: string; timeStamp: string; nonceStr: string; signType: string };
  }>({ url: `/api/proxy-orders/${orderId}/pay/xhs`, method: "POST", data: {} });
}
