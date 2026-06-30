import { PRODUCTS, getProductById } from "../../data/products";
import { getPersonaById } from "../../data/personas";
import { SCENT_TAGS } from "../../data/scentTags";
import type {
  PersonaId,
  TagScores,
  ProductRecommendation,
  RecommendProductsResult,
  ScentTag,
  RecommendationRole,
  Locale,
} from "./types";

/** Localized display label for a recommendation role (the role itself is a stable zh key). */
const ROLE_LABELS: Record<Locale, Record<RecommendationRole, string>> = {
  zh: {
    本命香候选: "本命香候选",
    安全款: "安全款",
    惊喜尝试: "惊喜尝试",
  },
  en: {
    本命香候选: "Signature pick",
    安全款: "Safe pick",
    惊喜尝试: "Surprise pick",
  },
};

export function getRoleLabel(role: RecommendationRole, locale: Locale = "zh"): string {
  return (ROLE_LABELS[locale] ?? ROLE_LABELS.zh)[role] ?? role;
}

export function recommendProducts(input: {
  personaId: PersonaId;
  tagScores: TagScores;
  limit?: number;
  locale?: Locale;
}): RecommendProductsResult {
  const { personaId, tagScores, limit = 3, locale = "zh" } = input;
  const persona = getPersonaById(personaId);

  const scored = PRODUCTS.map((product) => {
    let score = 0;

    for (const tag of SCENT_TAGS) {
      const productTagScore = product.scentTags[tag] || 0;
      const userTagScore = tagScores[tag] || 0;
      score += productTagScore * userTagScore * 0.1;
    }

    if (persona && persona.recommendedProductIds.includes(product.id)) {
      score += 5;
    }

    if (persona && persona.primaryTags.some((t) => product.scentTags[t as ScentTag] > 5)) {
      score += 3;
    }

    if (persona && persona.avoidTags.some((t) => product.scentTags[t as ScentTag] > 5)) {
      score -= 2;
    }

    if ((tagScores.sweet || 0) < 2 && product.scentTags.sweet > 6) {
      score -= 4;
    }

    if ((tagScores.presence || 0) < 2 && product.scentTags.presence > 6) {
      score -= 3;
    }

    return { product, score: Math.round(score * 10) / 10 };
  }).sort((a, b) => b.score - a.score);

  const recommendations: ProductRecommendation[] = [];
  const usedIds = new Set<string>();

  if (scored.length > 0) {
    const top = scored[0];
    recommendations.push({
      productId: top.product.id,
      score: top.score,
      role: "本命香候选",
      reason: buildReason(top.product.id, "本命香候选", personaId, tagScores, locale),
    });
    usedIds.add(top.product.id);
  }

  const safeCandidate = scored.find((s) => !usedIds.has(s.product.id) && s.product.scentTags.soft > 5);
  if (safeCandidate) {
    recommendations.push({
      productId: safeCandidate.product.id,
      score: safeCandidate.score,
      role: "安全款",
      reason: buildReason(safeCandidate.product.id, "安全款", personaId, tagScores, locale),
    });
    usedIds.add(safeCandidate.product.id);
  } else {
    const fallback = scored.find((s) => !usedIds.has(s.product.id));
    if (fallback) {
      recommendations.push({
        productId: fallback.product.id,
        score: fallback.score,
        role: "安全款",
        reason: buildReason(fallback.product.id, "安全款", personaId, tagScores, locale),
      });
      usedIds.add(fallback.product.id);
    }
  }

  const exploratory = scored.find((s) => !usedIds.has(s.product.id));
  if (exploratory) {
    recommendations.push({
      productId: exploratory.product.id,
      score: exploratory.score,
      role: "惊喜尝试",
      reason: buildReason(exploratory.product.id, "惊喜尝试", personaId, tagScores, locale),
    });
    usedIds.add(exploratory.product.id);
  }

  while (recommendations.length < limit && recommendations.length < scored.length) {
    const next = scored.find((s) => !usedIds.has(s.product.id));
    if (!next) break;
    recommendations.push({
      productId: next.product.id,
      score: next.score,
      role: "惊喜尝试",
      reason: buildReason(next.product.id, "惊喜尝试", personaId, tagScores, locale),
    });
    usedIds.add(next.product.id);
  }

  return { recommendations: recommendations.slice(0, limit) };
}

function buildReason(
  productId: string,
  role: RecommendationRole,
  personaId: PersonaId,
  tagScores: TagScores,
  locale: Locale = "zh"
): string {
  const product = getProductById(productId, locale);
  const persona = getPersonaById(personaId, locale);
  if (!product) return locale === "en" ? "Worth a try" : "推荐尝试";

  if (locale === "en") {
    if (role === "本命香候选") {
      if (persona && persona.recommendedProductIds.includes(productId)) {
        return `“${product.name}” is a signature-scent pick for “${persona.name}” and a strong match for your scent preferences. ${product.emotionalScene}`;
      }
      return `“${product.name}” is the closest match to your scent preferences. ${product.emotionalScene}`;
    }
    if (role === "安全款") {
      return `“${product.name}” is a safe pick — gentle and easy to like. ${product.plainDescription}`;
    }
    return `“${product.name}”, as a surprise pick, might open up new possibilities. ${product.emotionalScene}`;
  }

  if (role === "本命香候选") {
    if (persona && persona.recommendedProductIds.includes(productId)) {
      return `「${product.name}」是「${persona.name}」的本命香候选，和你的气味偏好高度匹配。${product.emotionalScene}`;
    }
    return `「${product.name}」和你的气味偏好最匹配。${product.emotionalScene}`;
  }

  if (role === "安全款") {
    return `「${product.name}」是安全款，温柔不踩雷。${product.plainDescription}`;
  }

  return `「${product.name}」作为惊喜尝试，也许会打开新的可能性。${product.emotionalScene}`;
}

export function generateResultSummary(input: {
  personaId: PersonaId;
  tagScores: TagScores;
  locale?: Locale;
}): {
  personaName: string;
  topTags: ScentTag[];
  avoidTags: ScentTag[];
  summary: string;
} {
  const locale = input.locale ?? "zh";
  const persona = getPersonaById(input.personaId, locale);
  if (!persona) {
    return {
      personaName: locale === "en" ? "Unknown" : "未知",
      topTags: [],
      avoidTags: [],
      summary: locale === "en" ? "Could not generate a report" : "无法生成报告",
    };
  }

  const sortedTags = Object.entries(input.tagScores)
    .filter(([_, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k as ScentTag);

  return {
    personaName: persona.name,
    topTags: sortedTags.slice(0, 5),
    avoidTags: persona.avoidTags,
    summary: persona.reportSections.identity,
  };
}
