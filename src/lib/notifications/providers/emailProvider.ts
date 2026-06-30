import type { NotificationProvider } from "../types";

/** Resend email (HTTP, no SDK). https://resend.com/docs/api-reference/emails */
export const resendEmailProvider: NotificationProvider = {
  channel: "email",
  isConfigured() { return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM); },
  async send(input) {
    if (!input.to) return { ok: false, error: "no_recipient" };
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env.RESEND_FROM, to: [input.to], subject: input.title, text: input.content }),
      });
      const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      return res.ok ? { ok: true, providerMessageId: json.id } : { ok: false, error: json.message || `http_${res.status}` };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "send_error" };
    }
  },
};
