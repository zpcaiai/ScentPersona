import { describe, expect, it } from "vitest";
import { extractScentTags } from "@/lib/fragrance/extractScentTags";

describe("extractScentTags", () => {
  it("scores clean calm woody perfume text", () => {
    const result = extractScentTags({
      title: "白茶雪松纸张感香水",
      topNotes: ["白茶", "柑橘"],
      middleNotes: ["纸张"],
      baseNotes: ["雪松"],
      description: "干净、安静、适合通勤",
    });

    expect(result.scores.clean).toBeGreaterThan(0);
    expect(result.scores.woody).toBeGreaterThan(0);
    expect(result.scores.calm).toBeGreaterThan(0);
    expect(result.confidence).not.toBe("low");
  });
});
