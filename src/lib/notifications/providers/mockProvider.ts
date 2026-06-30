import crypto from "crypto";
import type { NotificationProvider } from "../types";

/** Mock channel provider for email/sms/wechat in MVP. */
export function makeMockProvider(channel: string): NotificationProvider {
  return {
    channel,
    isConfigured() { return true; },
    async send() {
      return { ok: true, providerMessageId: `mock_${channel}_${crypto.randomBytes(4).toString("hex")}` };
    },
  };
}
