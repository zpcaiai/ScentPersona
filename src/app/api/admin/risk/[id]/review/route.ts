import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditAdminAction } from "@/lib/admin/audit";
import { getAdminOperator } from "@/lib/admin/auth";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

// [id] = assessmentId. status: approved (clear/allow) | rejected (uphold) | ignored
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const status = sanitizeText(body.status, 20) ?? "ignored";
  const note = sanitizeText(body.note, 300);

  const assessment = await db.riskAssessment.findUnique({ where: { id: params.id } });
  if (!assessment) return NextResponse.json({ error: "assessment_not_found" }, { status: 404 });

  const review = await db.manualRiskReview.findFirst({ where: { assessmentId: assessment.id, status: "pending" }, orderBy: { createdAt: "desc" } });
  if (review) {
    await db.manualRiskReview.update({ where: { id: review.id }, data: { status, reviewedBy: operator, reviewNote: note, reviewedAt: new Date() } });
  }

  // Approving clears blocking flags so the order can proceed to payment.
  if (status === "approved" && assessment.targetType === "order") {
    await db.orderRiskFlag.updateMany({ where: { orderId: assessment.targetId, resolved: false }, data: { resolved: true } });
  }
  await auditAdminAction({ orderId: assessment.targetType === "order" ? assessment.targetId : undefined, adminUserId: operator, action: "risk_review", detail: `${assessment.id} -> ${status}` });
  return NextResponse.json({ ok: true });
}
