import { NextResponse } from "next/server";
import { adjustStock, OversellError } from "@/lib/inventory/stock";
import { getAdminOperator } from "@/lib/admin/auth";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";
const MOVES = ["inbound", "adjust", "damaged", "expired"] as const;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const movement = sanitizeText(body.movement, 20) as (typeof MOVES)[number] | null;
  const quantity = Number.isFinite(body.quantity) ? Math.floor(Number(body.quantity)) : 0;
  const reason = sanitizeText(body.reason, 120) ?? "库存调整";
  if (!movement || !MOVES.includes(movement) || quantity === 0) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    await adjustStock(params.id, movement, quantity, reason, operator);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof OversellError) return NextResponse.json({ error: err.message }, { status: 409 });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
