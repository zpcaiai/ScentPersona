import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || !body.productType || typeof body.price !== "number") {
      return NextResponse.json(
        { error: "Invalid request: productType and price are required" },
        { status: 400 }
      );
    }

    if (!body.customerName || !body.customerPhone) {
      return NextResponse.json(
        { error: "Invalid request: customerName and customerPhone are required" },
        { status: 400 }
      );
    }

    const intent = await db.purchaseIntent.create({
      data: {
        sessionId: body.sessionId ?? null,
        productType: body.productType,
        productIdsJson: JSON.stringify(body.productIds ?? []),
        price: body.price,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail ?? null,
        note: body.note ?? null,
        status: "created",
      },
    });

    // TODO: Integrate real payment provider here
    // const paymentIntent = await createPaymentIntent({
    //   purchaseIntentId: intent.id,
    //   amount: body.price,
    //   currency: "CNY",
    //   description: "ScentPersona 气味小样套装",
    //   customer: { name: body.customerName, phone: body.customerPhone },
    //   metadata: { sessionId: body.sessionId },
    // });

    return NextResponse.json({
      purchaseIntentId: intent.id,
      status: "created",
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
