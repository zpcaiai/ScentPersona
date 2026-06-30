export type ScentTag =
  | "clean"
  | "cold"
  | "sweet"
  | "woody"
  | "soft"
  | "presence"
  | "sleep"
  | "commute"
  | "date"
  | "gift"
  | "spiritual"
  | "bright"
  | "mature"
  | "cozy"
  | "escape";

export type PersonaId =
  | "white-shirt-morning"
  | "rain-study"
  | "warm-sweater"
  | "midnight-cabin"
  | "orchard-sunshine"
  | "cool-black"
  | "olive-rest"
  | "city-escape";

export type TagScores = Record<ScentTag, number>;
export type PartialTagScores = Partial<Record<ScentTag, number>>;
export type PersonaScores = Record<PersonaId, number>;
export type PartialPersonaScores = Partial<Record<PersonaId, number>>;

export interface QuizAnswerInput {
  questionId: string;
  optionId: string;
}

export interface ScoreQuizResult {
  tagScores: TagScores;
  normalizedTagScores: TagScores;
  personaScores: PersonaScores;
  warnings: string[];
}

export interface MatchPersonaResult {
  personaId: PersonaId;
  confidence: number;
  reasons: string[];
}

export type RecommendationRole = "本命香候选" | "安全款" | "惊喜尝试";

export interface ProductRecommendation {
  productId: string;
  score: number;
  role: RecommendationRole;
  reason: string;
}

export interface RecommendProductsResult {
  recommendations: ProductRecommendation[];
}

export interface ResultSummary {
  personaName: string;
  topTags: ScentTag[];
  avoidTags: ScentTag[];
  summary: string;
}

/** Shared UI locale (i18n). */
export type Locale = "zh" | "en";
