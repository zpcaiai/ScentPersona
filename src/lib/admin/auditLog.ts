import { db } from "@/lib/db";

/**
 * Persist a sensitive-data access record (Skill 41).
 * Call whenever an admin surface reveals full phone / address / payment data.
 * Never throws — auditing must not break the request.
 */
export async function logDataAccess(params: {
  adminUserId?: string | null;
  targetUserId?: string | null;
  resourceType: string;
  resourceId: string;
  action: "view" | "export" | "update" | "delete";
  fields?: string[];
  reason?: string;
}): Promise<void> {
  try {
    await db.dataAccessLog.create({
      data: {
        adminUserId: params.adminUserId ?? null,
        targetUserId: params.targetUserId ?? null,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        action: params.action,
        fieldsJson: JSON.stringify(params.fields ?? []),
        reason: params.reason ?? null,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[auditLog] failed", err);
  }
}
