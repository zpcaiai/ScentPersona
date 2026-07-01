#!/usr/bin/env node
/**
 * 一键重置演示数据：删除所有 DEMO- / @scentpersona.example 演示记录，然后重播 SEED_DEMO 种子。
 *
 * 用法：
 *   node scripts/reset-demo.mjs          预览将删除的数量，不动数据
 *   node scripts/reset-demo.mjs --yes    执行删除 + 重新播种（需 DATABASE_URL）
 *
 * 仅影响带演示标记的数据（订单号 DEMO-、邮箱 @scentpersona.example、quiz source demo-、
 * 事件 {"demo":true}、各票据号 DEMO-），不触碰真实业务数据。
 */
import { execSync } from "node:child_process";

const yes = process.argv.includes("--yes");
const { PrismaClient } = await import("@prisma/client");
const db = new PrismaClient();

async function main() {
  const orderIds = (await db.order.findMany({ where: { orderNo: { startsWith: "DEMO-" } }, select: { id: true } })).map((o) => o.id);
  const userIds = (await db.user.findMany({ where: { email: { endsWith: "@scentpersona.example" } }, select: { id: true } })).map((u) => u.id);

  const counts = {
    orders: orderIds.length,
    users: userIds.length,
    profitSnapshots: await db.orderProfitSnapshot.count({ where: { orderId: { in: orderIds } } }),
    quizSessions: await db.quizSession.count({ where: { source: { startsWith: "demo-" } } }),
    productEvents: await db.userProductEvent.count({ where: { eventValueJson: { contains: '"demo":true' } } }),
    supportTickets: await db.supportTicket.count({ where: { ticketNo: { startsWith: "DEMO-" } } }),
    afterSales: await db.afterSalesCase.count({ where: { caseNo: { startsWith: "DEMO-" } } }),
    fulfillment: await db.fulfillmentOrder.count({ where: { fulfillmentNo: { startsWith: "DEMO-" } } }),
  };
  console.log("将清除的演示数据：\n" + JSON.stringify(counts, null, 2));

  if (!yes) {
    console.log("\n预览模式：未删除任何数据。确认后执行：node scripts/reset-demo.mjs --yes");
    return;
  }

  // 子表先删（这些表用字符串 orderId，无外键级联）；再删订单（级联其自身 payments/refunds/events 等）；最后删用户
  await db.orderProfitSnapshot.deleteMany({ where: { orderId: { in: orderIds } } });
  await db.couponRedemption.deleteMany({ where: { orderId: { in: orderIds } } });
  await db.sampleFeedbackFlow.deleteMany({ where: { orderId: { in: orderIds } } });
  await db.fullSizeRecommendation.deleteMany({ where: { sourceOrderId: { in: orderIds } } });
  await db.afterSalesCase.deleteMany({ where: { caseNo: { startsWith: "DEMO-" } } });
  await db.supportTicket.deleteMany({ where: { ticketNo: { startsWith: "DEMO-" } } });
  await db.fulfillmentOrder.deleteMany({ where: { fulfillmentNo: { startsWith: "DEMO-" } } });
  await db.order.deleteMany({ where: { orderNo: { startsWith: "DEMO-" } } });
  await db.scentWardrobe.deleteMany({ where: { userId: { in: userIds } } });
  await db.user.deleteMany({ where: { email: { endsWith: "@scentpersona.example" } } });
  await db.quizSession.deleteMany({ where: { source: { startsWith: "demo-" } } });
  await db.userProductEvent.deleteMany({ where: { eventValueJson: { contains: '"demo":true' } } });
  console.log("✅ 已清除演示数据。");

  console.log("↻ 重新播种演示数据（SEED_DEMO=1）...");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env: { ...process.env, SEED_DEMO: "1" } });
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await db.$disconnect(); });
