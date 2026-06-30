import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";
import { verifyOrderLookup } from "@/lib/orders/orderLookup";
import { buildFullSizeRecommendation } from "@/lib/conversion/recommendFromFeedback";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

async function authorize(request: Request, order: { accessToken: string; customerPhone: string | null; userId?: string | null }, token?: unknown) {
  const userId = getUserIdFromRequest(request);
  if (userId && order.userId === userId) return userId;
  if (verifyOrderLookup(order, { token })) return order.userId;
  return false;
}

export async function GET(request: Request, { params }: { params: { orderNo: string } }) {
  const token = new URL(request.url).searchParams.get("token") ?? undefined;
  const order = await db.order.findUnique({ where: { orderNo: params.orderNo } });
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if ((await authorize(request, order, token)) === false) return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  const feedbacks = await db.scentFeedback.findMany({ where: { orderId: order.id } });
  const recs = await db.fullSizeRecommendation.findMany({ where: { sourceOrderId: order.id } });
  return NextResponse.json({ feedbacks, recommendations: recs });
}

export async function POST(request: Request, { params }: { params: { orderNo: string } }) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const order = await db.order.findUnique({ where: { orderNo: params.orderNo } });
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const userId = await authorize(request, order, body.token);
  if (userId === false) return NextResponse.json({ error: "unauthorized" }, { status: 403 });

  const productId = sanitizeText(body.productId, 60);
  if (!productId) return NextResponse.json({ error: "productId_required" }, { status: 400 });
  const likeLevel = sanitizeText(body.likeLevel, 12) ?? "neutral";

  await db.scentFeedback.create({
    data: {
      userId: userId ?? null,
      orderId: order.id,
      productId,
      rating: Number.isFinite(body.rating) ? Number(body.rating) : 0,
      likeLevel,
      tooSweet: body.tooSweet === true,
      tooStrong: body.tooStrong === true,
      tooCold: body.tooCold === true,
      tooLight: body.tooLight === true,
      goodForSceneJson: JSON.stringify(Array.isArray(body.goodForScene) ? body.goodForScene : []),
      comment: sanitizeText(body.comment, 400),
    },
  });

  // Update the user's scent profile.
  if (userId) {
    const sp = await db.userScentProfile.findUnique({ where: { userId } });
    if (sp) {
      const key = likeLevel === "love" || likeLevel === "like" ? "likedProductIdsJson" : likeLevel === "dislike" ? "dislikedProductIdsJson" : null;
      if (key) {
        let arr: string[] = [];
        try { arr = JSON.parse((sp as Record<string, string>)[key] || "[]"); } catch { /* */ }
        if (!arr.includes(productId)) arr.push(productId);
        await db.userScentProfile.update({ where: { userId }, data: { [key]: JSON.stringify(arr) } });
      }
    }
  }

  // Loved → full-size recommendation + sample-credit coupon.
  let recommendation = null;
  if (likeLevel === "love" || likeLevel === "like") {
    const built = await buildFullSizeRecommendation({ userId, sourceOrderId: order.id, productId, sampleCreditCents: order.amount }).catch(() => null);
    recommendation = built?.recommendation ?? null;
    await db.sampleFeedbackFlow.upsert({
      where: { orderId: order.id },
      create: { orderId: order.id, userId: userId ?? null, status: "completed", recommendedFullSizeProductId: productId },
      update: { status: "completed", recommendedFullSizeProductId: productId },
    });
  }
  return NextResponse.json({ ok: true, recommendation });
}
