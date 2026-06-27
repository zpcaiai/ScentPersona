import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  decryptWechatResource,
  getWechatMerchantId,
  verifyWechatCallback,
} from "@/lib/wechat-pay";

const MAX_CALLBACK_SKEW_SECONDS = 5 * 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const timestamp = request.headers.get("Wechatpay-Timestamp") || "";
    const nonce = request.headers.get("Wechatpay-Nonce") || "";
    const signature = request.headers.get("Wechatpay-Signature") || "";

    if (!timestamp || !nonce || !signature) {
      return NextResponse.json(
        { code: "FAIL", message: "Missing Wechatpay headers" },
        { status: 400 }
      );
    }

    const callbackTime = Number(timestamp);
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(callbackTime) || Math.abs(now - callbackTime) > MAX_CALLBACK_SKEW_SECONDS) {
      return NextResponse.json(
        { code: "FAIL", message: "Invalid Wechatpay timestamp" },
        { status: 400 }
      );
    }

    if (!verifyWechatCallback(timestamp, nonce, body, signature)) {
      return NextResponse.json(
        { code: "FAIL", message: "Signature verification failed" },
        { status: 400 }
      );
    }

    const parsed = JSON.parse(body) as {
      event_type: string;
      resource: {
        ciphertext: string;
        nonce: string;
        associated_data: string;
      };
    };

    if (parsed.event_type !== "TRANSACTION.SUCCESS") {
      return NextResponse.json({ code: "SUCCESS", message: "OK" });
    }

    const resource = decryptWechatResource(
      parsed.resource.ciphertext,
      parsed.resource.nonce,
      parsed.resource.associated_data
    ) as {
      out_trade_no: string;
      transaction_id: string;
      trade_state: string;
      mchid?: string;
      amount?: {
        total?: number;
      };
    };

    const order = await db.order.findUnique({
      where: { orderNo: resource.out_trade_no },
    });

    if (!order) {
      return NextResponse.json(
        { code: "FAIL", message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status === "paid") {
      return NextResponse.json({ code: "SUCCESS", message: "OK" });
    }

    if (resource.mchid && resource.mchid !== getWechatMerchantId()) {
      return NextResponse.json(
        { code: "FAIL", message: "Merchant mismatch" },
        { status: 400 }
      );
    }

    if (typeof resource.amount?.total === "number" && resource.amount.total !== order.amount) {
      return NextResponse.json(
        { code: "FAIL", message: "Amount mismatch" },
        { status: 400 }
      );
    }

    if (resource.trade_state === "SUCCESS") {
      await db.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          transactionId: resource.transaction_id,
          paidAt: new Date(),
        },
      });
    }

    return NextResponse.json({ code: "SUCCESS", message: "OK" });
  } catch {
    return NextResponse.json(
      { code: "FAIL", message: "Internal error" },
      { status: 500 }
    );
  }
}
