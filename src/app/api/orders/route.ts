import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Phone-based order lookup is disabled. Use order access tokens." },
    { status: 410 }
  );
}
