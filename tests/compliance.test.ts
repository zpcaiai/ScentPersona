import { describe, it, expect } from "vitest";
import { findRiskyClaims, suggestSafeCopy, assertSafeCopy } from "@/lib/compliance";

describe("compliance guard", () => {
  it("detects obvious medical claims", () => {
    const text = "这款香氛可以治疗焦虑和改善失眠";
    const claims = findRiskyClaims(text);
    expect(claims.length).toBeGreaterThanOrEqual(2);
    expect(claims.some((c) => c.term === "治疗焦虑")).toBe(true);
    expect(claims.some((c) => c.term === "改善失眠")).toBe(true);
  });

  it("does not flag safe emotional copy", () => {
    const text = "让房间先安静下来，建立睡前仪式感";
    const claims = findRiskyClaims(text);
    expect(claims).toHaveLength(0);
  });

  it("suggests replacement phrases", () => {
    const text = "治疗焦虑，改善失眠";
    const safe = suggestSafeCopy(text);
    expect(safe).not.toContain("治疗焦虑");
    expect(safe).not.toContain("改善失眠");
    expect(safe).toContain("安静的睡前氛围");
    expect(safe).toContain("睡前仪式感");
  });

  it("assertSafeCopy returns correct safe status", () => {
    const risky = assertSafeCopy("保证入睡，100%有效");
    expect(risky.safe).toBe(false);
    expect(risky.risks.length).toBeGreaterThan(0);

    const safe = assertSafeCopy("给疲惫的一天一个结束仪式");
    expect(safe.safe).toBe(true);
    expect(safe.risks).toHaveLength(0);
  });
});
