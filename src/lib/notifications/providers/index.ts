import type { NotificationProvider } from "../types";
import { makeMockProvider } from "./mockProvider";
import { resendEmailProvider } from "./emailProvider";
import { aliyunSmsProvider, twilioSmsProvider } from "./smsProvider";
import { wechatTemplateProvider } from "./wechatTemplateProvider";

/** Pick the best configured provider per channel, falling back to mock. */
export function getNotificationProvider(channel: string): NotificationProvider | null {
  if (channel === "email") return resendEmailProvider.isConfigured() ? resendEmailProvider : makeMockProvider("email");
  if (channel === "sms") {
    if (aliyunSmsProvider.isConfigured()) return aliyunSmsProvider;
    if (twilioSmsProvider.isConfigured()) return twilioSmsProvider;
    return makeMockProvider("sms");
  }
  if (channel === "wechat") return wechatTemplateProvider.isConfigured() ? wechatTemplateProvider : makeMockProvider("wechat");
  return null;
}
