import Taro from "@tarojs/taro";

export const API_BASE = process.env.API_BASE || "https://scentpersona.vercel.app";

interface RequestOptions {
  url: string;
  method?: "GET" | "POST";
  data?: Record<string, unknown>;
  header?: Record<string, string>;
}

export function assetUrl(path?: string): string {
  if (!path) return "";
  return path.startsWith("http") ? path : `${API_BASE}${path}`;
}

export async function request<T = unknown>(options: RequestOptions): Promise<T> {
  const { url, method = "GET", data, header } = options;
  const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;

  const res = await Taro.request({
    url: fullUrl,
    method,
    data,
    header: {
      "Content-Type": "application/json",
      ...header,
    },
  });

  if (res.statusCode >= 200 && res.statusCode < 300) {
    return res.data as T;
  }

  throw new Error(`API Error: ${res.statusCode} ${url}`);
}

export function submitQuiz(answers: { questionId: string; optionId: string }[]) {
  return request<{ sessionId: string; personaId: string; recommendations: unknown[] }>({
    url: "/api/quiz/submit",
    method: "POST",
    data: { answers },
  });
}

export function trackEvent(data: {
  eventName: string;
  path?: string;
  sessionId?: string;
  orderId?: string;
  personaId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  return request<{ status: string }>({
    url: "/api/analytics/event",
    method: "POST",
    data: {
      source: (Taro.getEnv() as string) === "XHS" ? "xhs" : "weapp",
      ...data,
    },
  }).catch(() => null);
}

export function fetchQuizResult(sessionId: string) {
  return request<{
    sessionId: string;
    personaId: string;
    tagScores: Record<string, number>;
    recommendedProductIds: string[];
  }>({
    url: `/api/quiz/result?sessionId=${sessionId}`,
    method: "GET",
  });
}

export function submitPurchaseIntent(data: {
  sessionId?: string;
  productType: string;
  productIds: string[];
  price: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  note?: string;
}) {
  return request<{ id: string }>({
    url: "/api/purchase/intent",
    method: "POST",
    data,
  });
}

export function submitFeedback(data: {
  sessionId?: string;
  orderId?: string;
  orderAccessToken?: string;
  personaId?: string;
  favoriteProductId?: string;
  dislikedProductIds?: string[];
  ratings?: Record<string, number>;
  comment?: string;
  boughtFullSize?: boolean;
  fullSizeProductId?: string;
}) {
  return request<{ id: string }>({
    url: "/api/feedback/submit",
    method: "POST",
    data,
  });
}

export function createOrder(data: {
  sessionId?: string;
  productType: string;
  productIds: string[];
  amount: number;
  platform: string;
  customerName: string;
  customerPhone: string;
  shippingAddress?: string;
  note?: string;
}) {
  return request<{
    orderId: string;
    orderNo: string;
    orderAccessToken: string;
    status: string;
    amount: number;
  }>({
    url: "/api/order/create",
    method: "POST",
    data,
  });
}

export function fetchOrder(orderId: string, accessToken: string) {
  return request<{
    orderId: string;
    orderNo: string;
    sessionId: string | null;
    productType: string;
    productIds: string[];
    amount: number;
    status: string;
    platform: string;
    customerName: string;
    customerPhone: string;
    shippingAddress: string | null;
    trackingNumber: string | null;
    transactionId: string | null;
    paidAt: string | null;
    shippedAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    refundedAt: string | null;
    createdAt: string;
  }>({
    url: `/api/order/${orderId}?accessToken=${encodeURIComponent(accessToken)}`,
    method: "GET",
  });
}

export function cancelOrder(orderId: string, accessToken: string) {
  return request<{
    orderId: string;
    status: string;
    cancelledAt: string | null;
  }>({
    url: `/api/order/${orderId}/cancel`,
    method: "POST",
    data: { accessToken },
  });
}

export function fetchOrders(phone: string) {
  return request<{
    orders: Array<{
      orderId: string;
      orderNo: string;
      orderAccessToken: string;
      productType: string;
      productIds: string[];
      amount: number;
      status: string;
      platform: string;
      createdAt: string;
      paidAt: string | null;
    }>;
  }>({
    url: `/api/orders?phone=${encodeURIComponent(phone)}`,
    method: "GET",
  });
}

export function requestWechatPay(orderId: string, accessToken: string, openid: string) {
  return request<{
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
  }>({
    url: "/api/payment/wechat",
    method: "POST",
    data: { orderId, accessToken, openid },
  });
}

export function requestWechatPayStatus(orderId: string, accessToken: string) {
  return request<{ status: string; tradeState?: string }>({
    url: "/api/payment/wechat/status",
    method: "POST",
    data: { orderId, accessToken },
  });
}

export function loginWechat(code: string) {
  return request<{ openid: string }>({
    url: "/api/auth/wechat-login",
    method: "POST",
    data: { code },
  });
}

export function requestXhsPay(orderId: string, accessToken: string) {
  return request<{
    tradeNo: string;
    timeStamp: string;
    nonceStr: string;
    signType: string;
    paySign: string;
  }>({
    url: "/api/payment/xhs",
    method: "POST",
    data: { orderId, accessToken },
  });
}
