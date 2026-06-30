import type { NotificationProvider } from "../types";

/**
 * WeChat Official-Account template message (服务号模板消息).
 * Recipient is the user's OA openid (pass via notification data.openid).
 * https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Template_Message_Interface.html
 */
let tokenCache: { token: string; exp: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (tokenCache && tokenCache.exp > Date.now() + 60_000) return tokenCache.token;
  const appid = process.env.WECHAT_OA_APPID;
  const secret = process.env.WECHAT_OA_SECRET;
  if (!appid || !secret) return null;
  try {
    const res = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`);
    const json = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
    if (!json.access_token) return null;
    tokenCache = { token: json.access_token, exp: Date.now() + (json.expires_in ?? 7200) * 1000 };
    return tokenCache.token;
  } catch {
    return null;
  }
}

export const wechatTemplateProvider: NotificationProvider = {
  channel: "wechat",
  isConfigured() {
    return Boolean(process.env.WECHAT_OA_APPID && process.env.WECHAT_OA_SECRET && process.env.WECHAT_OA_TEMPLATE_ID);
  },
  async send(input) {
    if (!input.to) return { ok: false, error: "no_openid" };
    const token = await getAccessToken();
    if (!token) return { ok: false, error: "no_access_token" };
    const md = (input.metadata ?? {}) as Record<string, unknown>;
    const data = (md.templateData as Record<string, unknown>) ?? {
      first: { value: input.title },
      keyword1: { value: input.content },
      remark: { value: "" },
    };
    const payload = {
      touser: input.to,
      template_id: process.env.WECHAT_OA_TEMPLATE_ID,
      url: typeof md.url === "string" ? md.url : undefined,
      data,
    };
    try {
      const res = await fetch(`https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${token}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { errcode?: number; errmsg?: string; msgid?: number };
      return json.errcode === 0 ? { ok: true, providerMessageId: String(json.msgid ?? "") } : { ok: false, error: json.errmsg || `errcode_${json.errcode}` };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "send_error" };
    }
  },
};
