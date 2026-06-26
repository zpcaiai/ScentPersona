import { describe, it, expect } from "vitest";
import { scoreQuizAnswers } from "@/lib/scoring/scoreQuiz";
import { matchPersona } from "@/lib/scoring/matchPersona";
import { recommendProducts } from "@/lib/scoring/recommendProducts";
import type { QuizAnswerInput } from "@/lib/scoring/types";

function makeAnswers(pairs: [string, string][]): QuizAnswerInput[] {
  return pairs.map(([questionId, optionId]) => ({ questionId, optionId }));
}

describe("scoreQuizAnswers", () => {
  it("returns normalized tag scores for a complete quiz", () => {
    const answers = makeAnswers([
      ["q1", "q1a"], ["q2", "q2a"], ["q3", "q3a"], ["q4", "q4a"],
      ["q5", "q5b"], ["q6", "q6a"], ["q7", "q7a"], ["q8", "q8a"],
      ["q9", "q9a"], ["q10", "q10a"],
    ]);

    const result = scoreQuizAnswers({ answers });

    expect(result.tagScores.clean).toBeGreaterThan(0);
    expect(result.normalizedTagScores.clean).toBeLessThanOrEqual(10);
    expect(result.normalizedTagScores.clean).toBeGreaterThanOrEqual(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("ignores unknown questionId and optionId without crashing", () => {
    const answers = makeAnswers([
      ["q1", "q1a"],
      ["unknown", "unknown"],
      ["q2", "nonexistent"],
    ]);

    const result = scoreQuizAnswers({ answers });

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.tagScores.clean).toBeGreaterThan(0);
  });

  it("handles empty answers gracefully", () => {
    const result = scoreQuizAnswers({ answers: [] });
    expect(result.tagScores.clean).toBe(0);
    expect(result.warnings).toHaveLength(0);
  });
});

describe("matchPersona", () => {
  it("matches warm/sleep-oriented answers to 暖灯毛衣型", () => {
    const answers = makeAnswers([
      ["q1", "q1b"], ["q2", "q2c"], ["q3", "q3b"], ["q4", "q4c"],
      ["q5", "q5c"], ["q6", "q6a"], ["q7", "q7c"], ["q8", "q8c"],
      ["q9", "q9b"], ["q10", "q10c"],
    ]);

    const scored = scoreQuizAnswers({ answers });
    const matched = matchPersona({
      tagScores: scored.tagScores,
      personaScores: scored.personaScores,
    });

    expect(matched.personaId).toBe("warm-sweater");
    expect(matched.confidence).toBeGreaterThan(0);
  });

  it("matches clean/commute-oriented answers to 白衬衫清晨型", () => {
    const answers = makeAnswers([
      ["q1", "q1a"], ["q2", "q2a"], ["q3", "q3a"], ["q4", "q4a"],
      ["q5", "q5b"], ["q6", "q6a"], ["q7", "q7a"], ["q8", "q8a"],
      ["q9", "q9a"], ["q10", "q10a"],
    ]);

    const scored = scoreQuizAnswers({ answers });
    const matched = matchPersona({
      tagScores: scored.tagScores,
      personaScores: scored.personaScores,
    });

    expect(matched.personaId).toBe("white-shirt-morning");
  });

  it("matches quiet/bookish answers to 雨后书房型", () => {
    const answers = makeAnswers([
      ["q1", "q1c"], ["q2", "q2b"], ["q3", "q3c"], ["q4", "q4b"],
      ["q5", "q5d"], ["q6", "q6d"], ["q7", "q7b"], ["q8", "q8b"],
      ["q9", "q9c"], ["q10", "q10b"],
    ]);

    const scored = scoreQuizAnswers({ answers });
    const matched = matchPersona({
      tagScores: scored.tagScores,
      personaScores: scored.personaScores,
    });

    expect(matched.personaId).toBe("rain-study");
  });
});

describe("recommendProducts", () => {
  it("returns 3 unique products", () => {
    const result = recommendProducts({
      personaId: "rain-study",
      tagScores: {
        clean: 5, cold: 3, sweet: 0, woody: 8, soft: 2, presence: 1,
        sleep: 3, commute: 2, date: 0, gift: 1, spiritual: 5, bright: 0,
        mature: 4, cozy: 2, escape: 3,
      },
    });

    expect(result.recommendations).toHaveLength(3);
    const ids = result.recommendations.map((r) => r.productId);
    expect(new Set(ids).size).toBe(3);
  });

  it("reduces 果园阳光 score when user sweet score is low", () => {
    const lowSweetResult = recommendProducts({
      personaId: "rain-study",
      tagScores: {
        clean: 5, cold: 5, sweet: 0, woody: 8, soft: 2, presence: 1,
        sleep: 3, commute: 2, date: 0, gift: 1, spiritual: 5, bright: 0,
        mature: 4, cozy: 2, escape: 3,
      },
    });

    const highSweetResult = recommendProducts({
      personaId: "orchard-sunshine",
      tagScores: {
        clean: 2, cold: 0, sweet: 8, woody: 1, soft: 3, presence: 2,
        sleep: 1, commute: 2, date: 5, gift: 3, spiritual: 1, bright: 6,
        mature: 1, cozy: 2, escape: 3,
      },
    });

    const lowSweetOrchard = lowSweetResult.recommendations.find(
      (r) => r.productId === "orchard-sunshine"
    );
    const highSweetOrchard = highSweetResult.recommendations.find(
      (r) => r.productId === "orchard-sunshine"
    );

    if (lowSweetOrchard && highSweetOrchard) {
      expect(lowSweetOrchard.score).toBeLessThan(highSweetOrchard.score);
    }
  });

  it("always recommends 3 products if pool has enough", () => {
    const result = recommendProducts({
      personaId: "cool-black",
      tagScores: {
        clean: 3, cold: 5, sweet: 0, woody: 3, soft: 2, presence: 4,
        sleep: 1, commute: 3, date: 2, gift: 1, spiritual: 2, bright: 1,
        mature: 4, cozy: 1, escape: 2,
      },
    });

    expect(result.recommendations).toHaveLength(3);
  });
});
