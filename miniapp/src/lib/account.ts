import Taro from "@tarojs/taro";
import { request, setUserToken, clearUserToken, getUserToken } from "./request";

export function isLoggedIn(): boolean { return !!getUserToken(); }

export async function accountLogin(phone: string): Promise<{ ok: boolean; token?: string; error?: string }> {
  const sessionId = Taro.getStorageSync("sp_session_id") || undefined;
  const res = await request<{ ok: boolean; token?: string; error?: string }>({
    url: "/api/account/login", method: "POST", data: { phone, sessionId },
  });
  if (res.token) setUserToken(res.token);
  return res;
}
export function accountLogout(): void { clearUserToken(); }

export function accountMe() { return request<any>({ url: "/api/account/me" }); }

export function listAddresses() { return request<{ addresses: any[] }>({ url: "/api/account/addresses" }); }
export function createAddress(data: Record<string, unknown>) { return request<any>({ url: "/api/account/addresses", method: "POST", data }); }
export function setDefaultAddress(id: string) { return request<any>({ url: `/api/account/addresses/${id}`, method: "POST", data: { isDefault: true } }); }
export function deleteAddress(id: string) { return request<any>({ url: `/api/account/addresses/${id}`, method: "DELETE" }); }

export function listCoupons() { return request<{ recommendations: any[] }>({ url: "/api/account/coupons" }); }
export function getReferrals() { return request<{ code: string; rewards: any[] }>({ url: "/api/account/referrals" }); }
export function redeemReferral(code: string) { return request<any>({ url: "/api/account/referrals", method: "POST", data: { code } }); }
export function getMembership() { return request<any>({ url: "/api/account/membership" }); }

export function listNotifications() { return request<{ notifications: any[]; unread: number }>({ url: "/api/account/notifications" }); }
export function readNotification(id: string) { return request<any>({ url: `/api/account/notifications/${id}/read`, method: "POST" }); }

export function listInvoices() { return request<{ invoices: any[] }>({ url: "/api/account/invoices" }); }
export function createInvoice(data: Record<string, unknown>) { return request<any>({ url: "/api/account/invoices", method: "POST", data }); }

export function getPrivacy() { return request<any>({ url: "/api/account/privacy" }); }
export function revokeMarketing() { return request<any>({ url: "/api/account/privacy/revoke", method: "POST", data: { consentType: "marketing" } }); }
export function requestDelete() { return request<any>({ url: "/api/account/privacy/delete-request", method: "POST", data: { reason: "用户申请" } }); }

export function getWardrobe() { return request<any>({ url: "/api/account/wardrobe" }); }
export function addWardrobe(productId: string, role: string) { return request<any>({ url: "/api/account/wardrobe", method: "POST", data: { productId, role } }); }
export function removeWardrobe(itemId: string) { return request<any>({ url: `/api/account/wardrobe/${itemId}`, method: "DELETE" }); }

export function sampleFeedback(orderNo: string, token: string, data: Record<string, unknown>) {
  return request<any>({ url: `/api/orders/${orderNo}/sample-feedback`, method: "POST", data: { token, ...data } });
}
export function afterSalesGet(orderId: string, token: string) { return request<any>({ url: `/api/proxy-orders/${orderId}/after-sales?token=${encodeURIComponent(token)}` }); }
export function afterSalesPost(orderId: string, data: Record<string, unknown>) { return request<any>({ url: `/api/proxy-orders/${orderId}/after-sales`, method: "POST", data }); }

export function supportList() { return request<{ tickets: any[] }>({ url: "/api/support" }); }
export function supportCreate(data: Record<string, unknown>) { return request<any>({ url: "/api/support", method: "POST", data }); }
export function supportThread(ticketNo: string) { return request<any>({ url: `/api/support/${ticketNo}/message` }); }
export function supportReply(ticketNo: string, message: string) { return request<any>({ url: `/api/support/${ticketNo}/message`, method: "POST", data: { message } }); }

export function getContent(slug: string) { return request<any>({ url: `/api/content/${slug}` }); }
export function getLegal(slug: string) { return request<any>({ url: `/api/legal/${slug}` }); }
