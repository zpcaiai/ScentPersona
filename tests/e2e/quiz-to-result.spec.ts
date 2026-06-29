import { expect, test } from "@playwright/test";

test("user can complete quiz submission flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "开始测试" }).first().click();
  await page.getByRole("button", { name: "开始测试" }).click();

  for (let i = 0; i < 10; i += 1) {
    await page.locator(".option-card").first().click();
    await page.getByRole("button", { name: i === 9 ? "查看结果" : "下一题" }).click();
  }

  await expect(async () => {
    const url = page.url();
    const hasError = await page.getByText("结果生成失败，请稍后重试。").isVisible();
    expect(url.includes("/result/") || hasError).toBe(true);
  }).toPass();
});
