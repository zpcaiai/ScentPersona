import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminOperator } from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { ticketId: string } }) {
  const operator = getAdminOperator(request);
  await db.supportTicket.update({ where: { id: params.ticketId }, data: { status: "closed", closedAt: new Date(), assignedTo: operator } });
  return NextResponse.json({ ok: true });
}
