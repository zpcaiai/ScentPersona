import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/utils";
import { createdAtWhere, parseAdminDateRange } from "@/lib/admin-date-range";

export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const dateRange = parseAdminDateRange(searchParams);
  const orders = await db.order.findMany({
    where: createdAtWhere(dateRange),
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const headers = [
    "orderNo",
    "status",
    "amount",
    "productIds",
    "customerName",
    "customerPhone",
    "shippingAddress",
    "trackingNumber",
    "platform",
    "transactionId",
    "createdAt",
    "paidAt",
    "shippedAt",
    "completedAt",
    "cancelledAt",
    "refundedAt",
  ];

  const rows = orders.map((order) => [
    order.orderNo,
    order.status,
    (order.amount / 100).toFixed(2),
    parseJsonArray<string>(order.productIdsJson).join("|"),
    order.customerName,
    order.customerPhone,
    order.shippingAddress,
    order.trackingNumber,
    order.platform,
    order.transactionId,
    order.createdAt.toISOString(),
    order.paidAt?.toISOString(),
    order.shippedAt?.toISOString(),
    order.completedAt?.toISOString(),
    order.cancelledAt?.toISOString(),
    order.refundedAt?.toISOString(),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="scentpersona-orders.csv"',
    },
  });
}
