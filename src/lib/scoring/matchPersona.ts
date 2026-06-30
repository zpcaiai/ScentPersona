import { PERSONAS, getPersonaById } from "@/data/personas";
import { SCENT_TAGS } from "@/data/scentTags";
import { PRODUCTS } from "@/data/products";
import type {
  TagScores,
  PersonaScores,
  MatchPersonaResult,
  PersonaId,
  ScentTag,
  Locale,
} from "./types";

export function matchPersona(input: {
  tagScores: TagScores;
  personaScores: PersonaScores;
  locale?: Locale;
}): MatchPersonaResult {
  const { tagScores, personaScores, locale = "zh" } = input;

  const ranked = PERSONAS.map((persona) => {
    let score = personaScores[persona.id] || 0;

    const tagOverlap = persona.primaryTags.reduce((sum, tag) => {
      return sum + Math.max(0, tagScores[tag as ScentTag] || 0);
    }, 0);

    const avoidPenalty = persona.avoidTags.reduce((sum, tag) => {
      return sum + Math.max(0, tagScores[tag as ScentTag] || 0) * 0.5;
    }, 0);

    score += tagOverlap - avoidPenalty;

    const productCoverage = persona.recommendedProductIds.length;

    return {
      persona,
      score,
      tagOverlap,
      productCoverage,
    };
  }).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.productCoverage - a.productCoverage;
  });

  const best = ranked[0];
  const second = ranked[1];
  const totalScore = ranked.reduce((sum, r) => sum + Math.max(0, r.score), 0);
  const confidence = totalScore > 0
    ? Math.min(1, Math.max(0, best.score) / totalScore)
    : 0.5;

  const en = locale === "en";
  const bestName = getPersonaById(best.persona.id, locale)?.name ?? best.persona.name;
  const secondName = second
    ? getPersonaById(second.persona.id, locale)?.name ?? second.persona.name
    : "";

  const reasons: string[] = [];

  if (best.tagOverlap > 0) {
    const topTagNames = best.persona.primaryTags
      .filter((t) => (tagScores[t as ScentTag] || 0) > 0)
      .slice(0, 3);
    if (topTagNames.length > 0) {
      reasons.push(
        en
          ? `Your scent preferences strongly match the core traits of “${bestName}”`
          : `你的气味偏好和「${bestName}」的核心标签高度匹配`
      );
    }
  }

  if ((personaScores[best.persona.id] || 0) > 0) {
    reasons.push(
      en
        ? "Your lifestyle answers point directly to this persona"
        : "你的生活方式选择直接指向这个人格类型"
    );
  }

  if (best.productCoverage > 0) {
    reasons.push(
      en
        ? `This persona has ${best.productCoverage} recommended ${best.productCoverage === 1 ? "product" : "products"} to match`
        : `这个人格有 ${best.productCoverage} 支推荐产品可以匹配`
    );
  }

  if (second && best.score - second.score < 1) {
    reasons.push(
      en
        ? `It's also close to “${secondName}”, but scores slightly higher overall`
        : `和「${secondName}」也比较接近，但综合评分略高`
    );
  }

  if (reasons.length === 0) {
    reasons.push(
      en ? "Matched from the overall pattern of your answers" : "根据你的回答综合匹配得出"
    );
  }

  return {
    personaId: best.persona.id as PersonaId,
    confidence: Math.round(confidence * 100) / 100,
    reasons,
  };
}
