import { PrismaClient } from "@prisma/client";
import { resetDemoData, seedDemoData } from "../src/lib/dev/demoData";

/** CLI: preview (default) or --yes to wipe + reseed demo data. Needs DATABASE_URL. */
const yes = process.argv.includes("--yes");
const db = new PrismaClient();

async function main() {
  const orders = await db.order.count({ where: { orderNo: { startsWith: "DEMO-" } } });
  const users = await db.user.count({ where: { email: { endsWith: "@scentpersona.example" } } });
  console.log(`演示订单 ${orders}，演示用户 ${users}`);
  if (!yes) { console.log("预览模式：加 --yes 执行删除并重新播种。"); return; }
  const removed = await resetDemoData(db);
  console.log("已清除：", JSON.stringify(removed));
  const seeded = await seedDemoData(db);
  console.log(`已重播演示数据：${seeded.orders} 单`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => db.$disconnect());
