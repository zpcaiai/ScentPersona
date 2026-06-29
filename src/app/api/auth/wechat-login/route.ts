import { NextRequest, NextResponse } from "next/server";
import { exchangeWechatLoginCode } from "@/lib/wechat-pay";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || typeof body.code !== "string" || body.code.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: code is required" },
        { status: 400 }
      );
    }

    const result = await exchangeWechatLoginCode(body.code);

    return NextResponse.json({
      openid: result.openid,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `WeChat login error: ${message}` },
      { status: 500 }
    );
  }
}
