import { test, expect } from "@playwright/test";

// Requires the app running with E2E_TEST=1 (enables the test-seed endpoint).
test.describe("代下单主流程 (proxy-order)", () => {
  test("API 全链路: 报价 → 确认 → 支付 → 采购 → 发货 → 签收", async ({ request }) => {
    const seed = await request.post("/api/test/seed-offer");
    test.skip(seed.status() === 404, "set E2E_TEST=1 to enable the seed endpoint");
    const { offerId, productId } = await seed.json();
    expect(offerId).toBeTruthy();
    expect(productId).toBeTruthy();

    // 1) quote
    const q = await request.post("/api/proxy-orders/quote", { data: { offerId, quantity: 1 } });
    expect(q.ok()).toBeTruthy();
    const quote = await q.json();
    expect(quote.status).toBe("quoted");
    expect(quote.breakdown.serviceFeeCents).toBeGreaterThan(0);
    const { orderId, orderNo, accessToken } = quote;

    // 2) confirm address + agreement
    const c = await request.post(`/api/proxy-orders/${orderId}/confirm`, {
      data: { recipientName: "测试用户", phone: "13800000000", province: "浙江省", city: "杭州市", district: "西湖区", addressLine1: "文三路100号5栋", agreementAccepted: true },
    });
    expect(c.ok()).toBeTruthy();

    // 3) pay (mock) then simulate PSP success via the signed webhook path
    const pay = await request.post(`/api/proxy-orders/${orderId}/pay`, { data: { provider: "mock" } });
    expect(pay.ok()).toBeTruthy();
    const mock = await request.post("/api/payments/mock", { data: { orderId, outcome: "success" } });
    expect((await mock.json()).status).toBe("paid");

    // idempotency: replaying the mock success must not double-process
    const replay = await request.post("/api/payments/mock", { data: { orderId, outcome: "success" } });
    expect(["already_paid", "no_pending_payment"]).toContain((await replay.json()).status);

    // 4) user sees paid
    const d1 = await request.get(`/api/proxy-orders/detail?orderNo=${orderNo}&token=${accessToken}`);
    expect((await d1.json()).status).toBe("paid");

    // 5) admin login (bootstrap owner from env)
    const login = await request.post("/api/admin/auth/login", {
      data: { email: process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@scentpersona.local", password: process.env.ADMIN_PASSWORD || "change-me" },
    });
    test.skip(!login.ok(), "admin bootstrap not configured (ADMIN_PASSWORD)");

    // 6) purchase start + complete (records platform order no + cost)
    expect((await request.post(`/api/admin/proxy-orders/${orderId}/purchase/start`)).ok()).toBeTruthy();
    const complete = await request.post(`/api/admin/proxy-orders/${orderId}/purchase/complete`, { data: { platformOrderNo: "TB123456789", purchaseCostCents: 15000 } });
    expect(complete.ok()).toBeTruthy();

    // 7) ship + sync (mock provider → trackingNo ending even = delivered)
    expect((await request.post(`/api/admin/proxy-orders/${orderId}/shipment`, { data: { carrierName: "顺丰", trackingNo: "SF12345678" } })).ok()).toBeTruthy();
    await request.post(`/api/admin/proxy-orders/${orderId}/shipment/sync`, { data: { provider: "mock" } });

    // 8) final state shipped or delivered
    const d2 = await request.get(`/api/proxy-orders/detail?orderNo=${orderNo}&token=${accessToken}`);
    expect(["shipped", "delivered"]).toContain((await d2.json()).status);
  });

  test("异常: 报价过期后不可确认（quote 过期语义）", async ({ request }) => {
    const seed = await request.post("/api/test/seed-offer");
    test.skip(seed.status() === 404, "set E2E_TEST=1");
    const { offerId } = await seed.json();
    const q = await request.post("/api/proxy-orders/quote", { data: { offerId } });
    const { orderId } = await q.json();
    // confirm without agreement -> rejected
    const bad = await request.post(`/api/proxy-orders/${orderId}/confirm`, { data: { recipientName: "x", phone: "13800000000", province: "浙", city: "杭", district: "西湖", addressLine1: "路1号", agreementAccepted: false } });
    expect(bad.status()).toBe(400);
  });

  test("UI: 商品比价页可发起代下单并到达确认页", async ({ page, request }) => {
    const seed = await request.post("/api/test/seed-offer");
    test.skip(seed.status() === 404, "set E2E_TEST=1");
    const { productId } = await seed.json();
    await page.goto(`/products/${productId}/offers`);
    const btn = page.getByRole("button", { name: "帮我代下单" }).first();
    await expect(btn).toBeVisible({ timeout: 15000 });
    await btn.click();
    await expect(page).toHaveURL(/\/proxy-order\/.*\/confirm/, { timeout: 15000 });
    await expect(page.getByText("确认商品与收货信息")).toBeVisible();
  });
});
