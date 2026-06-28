import Taro from "@tarojs/taro";

const API_BASE = "https://scentpersona.vercel.app";

interface RequestOptions {
  url: string;
  method?: "GET" | "POST";
  data?: Record<string, unknown>;
  header?: Record<string, string>;
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
    productType: string;
    productIds: string[];
    amount: number;
    status: string;
    platform: string;
    customerName: string;
    customerPhone: string;
    transactionId: string | null;
    paidAt: string | null;
    createdAt: string;
  }>({
    url: `/api/order/${orderId}?accessToken=${encodeURIComponent(accessToken)}`,
    method: "GET",
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
