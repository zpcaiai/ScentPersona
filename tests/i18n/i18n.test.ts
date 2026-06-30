import { describe, it, expect } from "vitest";
import { getSiteCopy, SITE_COPY } from "@/data/copy";
import { getPersonas, getPersonaById } from "@/data/personas";
import { getProducts, getProductById } from "@/data/products";
import { getQuizQuestions } from "@/data/quizQuestions";
import { getScentTagLabels } from "@/data/scentTags";
import { getProxyStatusCopy, getProxyCopy } from "@/data/proxyOrderCopy";
import { getRoleLabel } from "@/lib/scoring/recommendProducts";

const hasCJK = (s: string) => /[一-鿿]/.test(s);

describe("i18n bilingual data", () => {
  it("site copy differs by locale and defaults to zh", () => {
    expect(getSiteCopy("en").landing.heroCtaPrimary).toBe("Start the quiz");
    expect(hasCJK(getSiteCopy("zh").landing.heroCtaPrimary)).toBe(true);
    expect(getSiteCopy().landing.heroCtaPrimary).toBe(SITE_COPY.landing.heroCtaPrimary); // default zh
    expect(getSiteCopy("en").common.submit).toBe("Submit");
  });
  it("personas localize to English with same ids/shape", () => {
    const zh = getPersonas("zh");
    const en = getPersonas("en");
    expect(en.length).toBe(zh.length);
    en.forEach((p, i) => {
      expect(p.id).toBe(zh[i].id);            // structural field preserved
      expect(hasCJK(p.name)).toBe(false);     // name is English
      expect(p.keywords.length).toBe(zh[i].keywords.length);
    });
    expect(getPersonaById("white-shirt-morning", "en")?.name).toBe("White Shirt Morning");
    expect(getPersonaById("white-shirt-morning")?.name).toBe("白衬衫清晨型"); // default zh
  });
  it("products localize, ids preserved", () => {
    expect(hasCJK(getProductById("white-tea-morning", "en")!.name)).toBe(false);
    expect(getProductById("white-tea-morning")!.name).toBe("白茶清晨");
    expect(getProducts("en").every((p) => !hasCJK(p.name))).toBe(true);
  });
  it("quiz questions + options localize", () => {
    const en = getQuizQuestions("en");
    expect(hasCJK(en[0].question)).toBe(false);
    expect(en[0].options.every((o) => !hasCJK(o.label))).toBe(true);
  });
  it("scent tags, proxy status, role labels localize", () => {
    expect(getScentTagLabels("en").clean).toBe("Clean");
    expect(getProxyStatusCopy("en").paid.label).toBe("Paid");
    expect(hasCJK(getProxyCopy("en").riskNotices[0])).toBe(false);
    expect(getRoleLabel("本命香候选", "en")).toBe("Signature pick");
    expect(getRoleLabel("本命香候选")).toBe("本命香候选"); // default zh
  });
});
