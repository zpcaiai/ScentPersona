import { describe, expect, it } from "vitest";
import { extractProductAttributes } from "@/lib/products/extractProductAttributes";
import { matchProductToExisting } from "@/lib/products/matchProduct";

describe("product normalization", () => {
  it("extracts volume, concentration and sample flags", () => {
    const attrs = extractProductAttributes("香奈儿 CHANCE 邂逅 EDT 50毫升 小样试管");
    expect(attrs.brand).toBe("CHANEL");
    expect(attrs.volumeMl).toBe(50);
    expect(attrs.concentration).toBe("EDT");
    expect(attrs.isSample).toBe(true);
  });

  it("matches similar products", () => {
    const result = matchProductToExisting({
      title: "香奈儿 CHANCE 邂逅 EDT 50毫升",
      brand: "CHANEL",
      products: [{
        id: "p1",
        normalizedName: "chanel chance 邂逅 edt 50ml",
        brand: "CHANEL",
        concentration: "EDT",
        volumeMl: 50,
        topNotesJson: "[]",
        middleNotesJson: "[]",
        baseNotesJson: "[]",
      }],
    });

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.needsReview).toBe(false);
  });
});
