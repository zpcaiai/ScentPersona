import { db } from "@/lib/db";

/**
 * Admin action audit (Skill 36; upgraded by Skill 41 DataAccessLog).
 *
 * TODO(production): gate every admin surface behind real admin authentication
 * and authorization, and persist a dedicated DataAccessLog row for sensitive
 * reads (full phone / address / payment). Until that model lands, order-scoped
 * actions are recorded on the order timeline so they remain auditable.
 */
export async function auditAdminAction(params: {
  orderId?: string;
  adminUserId?: string | null;
  action: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    if (params.orderId) {
      await db.orderEvent.create({
        data: {
          orderId: params.orderId,
          eventType: "admin_action",
          title: `后台操作：${params.action}`,
          message: params.detail ?? null,
          operatorId: params.adminUserId ?? null,
          metadataJson: JSON.stringify(params.metadata ?? {}),
        },
      });
    } else {
      // eslint-disable-next-line no-console
      console.info("[audit]", params.action, params.adminUserId ?? "system", params.detail ?? "");
    }
  } catch (err) {
    // Auditing must never break the main flow.
    // eslint-disable-next-line no-console
    console.error("[audit] failed to record", err);
  }
}
