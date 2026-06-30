import { db } from "@/lib/db";
import { renderTemplate } from "./renderTemplate";
import { DEFAULT_TEMPLATES, MARKETING_TYPES } from "./types";
import { getNotificationProvider } from "./providers";

export interface SendNotificationInput {
  type: string;
  userId?: string | null;
  sessionId?: string | null;
  orderId?: string | null;
  channel?: string;
  data?: Record<string, string | number>;
}

/**
 * Create + deliver a notification (Skill 47). in_app is stored as sent;
 * other channels go through a provider. Marketing types respect the user's
 * NotificationPreference; order-critical types are always delivered.
 * Never throws — notification failures must not break the main flow.
 */
export async function sendNotification(input: SendNotificationInput) {
  try {
    const channel = input.channel ?? "in_app";

    if (MARKETING_TYPES.has(input.type) && input.userId) {
      const pref = await db.notificationPreference.findUnique({
        where: { userId_channel_type: { userId: input.userId, channel, type: input.type } },
      });
      if (pref && !pref.enabled) return null;
    }

    const tplRow = await db.notificationTemplate.findUnique({
      where: { type_channel: { type: input.type, channel } },
    });
    const tpl = tplRow
      ? { title: tplRow.titleTemplate, content: tplRow.contentTemplate }
      : DEFAULT_TEMPLATES[input.type] ?? { title: input.type, content: "" };

    const title = renderTemplate(tpl.title, input.data ?? {});
    const content = renderTemplate(tpl.content, input.data ?? {});

    const notification = await db.notification.create({
      data: {
        userId: input.userId ?? null,
        sessionId: input.sessionId ?? null,
        orderId: input.orderId ?? null,
        channel,
        type: input.type,
        title,
        content,
        status: channel === "in_app" ? "sent" : "pending",
        sentAt: channel === "in_app" ? new Date() : null,
        metadataJson: JSON.stringify(input.data ?? {}),
      },
    });

    if (channel !== "in_app") {
      // Resolve the recipient address for the channel.
      let to: string | null = null;
      if (input.userId && (channel === "email" || channel === "sms")) {
        const u = await db.user.findUnique({ where: { id: input.userId }, select: { email: true, phone: true } });
        to = channel === "email" ? u?.email ?? null : u?.phone ?? null;
      }
      if (channel === "wechat" && input.data && typeof input.data.openid === "string") {
        to = input.data.openid;
      }
      if (!to) {
        await db.notification.update({ where: { id: notification.id }, data: { status: "failed" } });
        await db.notificationLog.create({ data: { notificationId: notification.id, provider: channel, status: "failed", errorMessage: "no_recipient" } });
        return notification;
      }
      const provider = getNotificationProvider(channel);
      if (provider) {
        const res = await provider.send({ to, title, content, metadata: input.data });
        await db.notification.update({
          where: { id: notification.id },
          data: { status: res.ok ? "sent" : "failed", sentAt: res.ok ? new Date() : null },
        });
        await db.notificationLog.create({
          data: {
            notificationId: notification.id,
            provider: provider.channel,
            providerMessageId: res.providerMessageId ?? null,
            status: res.ok ? "sent" : "failed",
            errorMessage: res.error ?? null,
          },
        });
      }
    }
    return notification;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[notify] send failed", input.type, err);
    return null;
  }
}
