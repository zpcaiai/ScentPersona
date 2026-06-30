import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";
import { maskPhone } from "@/lib/privacy/masking";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true, scentProfile: true, addresses: { orderBy: { isDefault: "desc" } }, favorites: true },
  });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, orderNo: true, orderType: true, status: true, amount: true, finalTotalCents: true, productTitle: true, createdAt: true },
  });

  return NextResponse.json({
    user: { id: user.id, phone: maskPhone(user.phone), displayName: user.displayName },
    scentProfile: user.scentProfile,
    profile: user.profile,
    addressCount: user.addresses.length,
    favorites: user.favorites,
    orders,
  });
}
