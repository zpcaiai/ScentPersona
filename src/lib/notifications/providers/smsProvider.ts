import crypto from "crypto";
import type { NotificationProvider } from "../types";

/** Twilio SMS (international, freeform). */
export const twilioSmsProvider: NotificationProvider = {
  channel: "sms",
  isConfigured() { return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM); },
  async send(input) {
    if (!input.to) return { ok: false, error: "no_recipient" };
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: { Authorization: "Basic " + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ To: input.to, From: process.env.TWILIO_FROM!, Body: input.content }).toString(),
      });
      const json = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
      return res.ok ? { ok: true, providerMessageId: json.sid } : { ok: false, error: json.message || `http_${res.status}` };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "send_error" };
    }
  },
};

// Aliyun SMS (China, RPC HMAC-SHA1). Templates must be pre-approved; the
// notification metadata is passed as TemplateParam — your template var names
// must match the data keys (e.g. {orderNo}).
function pe(s: string): string {
  return encodeURIComponent(s).replace(/\+/g, "%20").replace(/\*/g, "%2A").replace(/%7E/g, "~");
}
export const aliyunSmsProvider: NotificationProvider = {
  channel: "sms",
  isConfigured() {
    return Boolean(process.env.ALIYUN_SMS_ACCESS_KEY_ID && process.env.ALIYUN_SMS_ACCESS_KEY_SECRET && process.env.ALIYUN_SMS_SIGN_NAME && process.env.ALIYUN_SMS_TEMPLATE_CODE);
  },
  async send(input) {
    if (!input.to) return { ok: false, error: "no_recipient" };
    const keyId = process.env.ALIYUN_SMS_ACCESS_KEY_ID!;
    const secret = process.env.ALIYUN_SMS_ACCESS_KEY_SECRET!;
    const params: Record<string, string> = {
      AccessKeyId: keyId, Action: "SendSms", Format: "JSON",
      PhoneNumbers: input.to, RegionId: "cn-hangzhou",
      SignName: process.env.ALIYUN_SMS_SIGN_NAME!,
      SignatureMethod: "HMAC-SHA1", SignatureNonce: crypto.randomUUID(), SignatureVersion: "1.0",
      TemplateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE!,
      TemplateParam: JSON.stringify(input.metadata ?? { content: input.content }),
      Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
      Version: "2017-05-25",
    };
    const canonical = Object.keys(params).sort().map((k) => `${pe(k)}=${pe(params[k])}`).join("&");
    const stringToSign = `GET&${pe("/")}&${pe(canonical)}`;
    const signature = crypto.createHmac("sha1", secret + "&").update(stringToSign).digest("base64");
    const url = `https://dysmsapi.aliyuncs.com/?${canonical}&Signature=${pe(signature)}`;
    try {
      const res = await fetch(url);
      const json = (await res.json().catch(() => ({}))) as { Code?: string; BizId?: string; Message?: string };
      return json.Code === "OK" ? { ok: true, providerMessageId: json.BizId } : { ok: false, error: json.Message || json.Code || `http_${res.status}` };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "send_error" };
    }
  },
};
