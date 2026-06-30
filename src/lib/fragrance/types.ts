export type ScentDimension = "clean" | "soft" | "woody" | "bright" | "presence" | "calm";

export type ScentTagScores = Record<ScentDimension, number>;

export interface ExtractScentTagsResult {
  scores: ScentTagScores;
  explain: Record<ScentDimension, string[]>;
  confidence: "high" | "medium" | "low";
}
