import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkClaims } from "@/lib/compliance/claimCheck";
import { auditAdminAction } from "@/lib/admin/audit";
import { getAdminOperator } from "@/lib/admin/auth";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { productId: string } }) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const product = await db.product.findUnique({ where: { id: params.productId } });
  if (!product) return NextResponse.json({ error: "product_not_found" }, { status: 404 });

  const claimText = sanitizeText(body.text, 1000) ?? product.normalizedName;
  const claims = checkClaims(claimText);
  const ingredientList = Array.isArray(body.ingredientList) ? (body.ingredientList as string[]).map(String) : undefined;
  const checkStatus = sanitizeText(body.checkStatus, 20) ?? "pending";

  const riskFlags = claims.flags.map((f) => f.flag);

  const data = {
    checkStatus,
    filingNo: sanitizeText(body.filingNo, 60),
    manufacturer: sanitizeText(body.manufacturer, 120),
    importer: sanitizeText(body.importer, 120),
    originCountry: sanitizeText(body.originCountry, 60),
    allergenNotice: sanitizeText(body.allergenNotice, 300),
    batchNo: sanitizeText(body.batchNo, 60),
    shelfLife: sanitizeText(body.shelfLife, 60),
    reviewNote: sanitizeText(body.reviewNote, 300),
    riskFlagsJson: JSON.stringify(riskFlags),
    reviewedBy: operator,
    reviewedAt: new Date(),
    ...(ingredientList ? { ingredientListJson: JSON.stringify(ingredientList) } : {}),
  };

  await db.cosmeticComplianceCheck.upsert({
    where: { productId: product.id },
    create: { productId: product.id, ...data },
    update: data,
  });
  await auditAdminAction({ adminUserId: operator, action: "compliance_review", detail: `${product.id} -> ${checkStatus}` });
  return NextResponse.json({ ok: true, claims });
}
