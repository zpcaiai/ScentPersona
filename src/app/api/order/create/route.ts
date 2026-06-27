import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PRODUCTS } from "@/data/products";
import { generateOrderAccessToken, generateOrderNo } from "@/lib/order-utils";

const SUPPORTED_PRODUCT_TYPES = new Set(["three_sample_kit", "sample-set-3"]);
const SAMPLE_KIT_AMOUNT = 2990;

function normalizeProductIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const productIds = new Set(PRODUCTS.map((p) => p.id));
  return value.filter((id): id is string => typeof id === "string" && productIds.has(id));
}

function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const phone = value.trim();
  return /^1\d{10}$/.test(phone) ? phone : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || !body.productType || typeof body.amount !== "number") {
      return NextResponse.json(
        { error: "Invalid request: productType and amount are required" },
        { status: 400 }
      );
    }

    if (!SUPPORTED_PRODUCT_TYPES.has(body.productType)) {
      return NextResponse.json(
        { error: "Invalid request: unsupported productType" },
        { status: 400 }
      );
    }

    if (body.amount !== SAMPLE_KIT_AMOUNT) {
      return NextResponse.json(
        { error: "Invalid request: amount does not match productType" },
        { status: 400 }
      );
    }

    const customerPhone = normalizePhone(body.customerPhone);
    if (!body.customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Invalid request: customerName and a valid customerPhone are required" },
        { status: 400 }
      );
    }

    const productIds = normalizeProductIds(body.productIds);
    if (productIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: at least one valid productId is required" },
        { status: 400 }
      );
    }

    const orderNo = generateOrderNo();
    const accessToken = generateOrderAccessToken();
    const platform = body.platform || "weapp";

    const order = await db.order.create({
      data: {
        orderNo,
        accessToken,
        sessionId: body.sessionId ?? null,
        productType: body.productType,
        productIdsJson: JSON.stringify(productIds),
        amount: body.amount,
        status: "pending",
        platform,
        customerName: String(body.customerName).trim(),
        customerPhone,
        shippingAddress: body.shippingAddress ?? null,
        note: body.note ?? null,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      orderNo: order.orderNo,
      orderAccessToken: order.accessToken,
      status: order.status,
      amount: order.amount,
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
