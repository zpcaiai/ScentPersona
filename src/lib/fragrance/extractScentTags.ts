import { MARKETING_WORDS, NOTE_WEIGHTS } from "./noteDictionary";
import type { ExtractScentTagsResult, ScentDimension, ScentTagScores } from "./types";

const DIMENSIONS = Object.keys(NOTE_WEIGHTS) as ScentDimension[];

export function extractScentTags(input: {
  title?: string;
  description?: string;
  scentFamily?: string;
  topNotes?: string[];
  middleNotes?: string[];
  baseNotes?: string[];
  productName?: string;
}): ExtractScentTagsResult {
  const scores = Object.fromEntries(DIMENSIONS.map((key) => [key, 0])) as ScentTagScores;
  const explain = Object.fromEntries(DIMENSIONS.map((key) => [key, [] as string[]])) as Record<ScentDimension, string[]>;
  const weightedText = [
    { text: input.title || "", factor: 0.8 },
    { text: input.productName || "", factor: 0.8 },
    { text: input.description || "", factor: 0.6 },
    { text: input.scentFamily || "", factor: 1 },
    { text: (input.topNotes || []).join(" "), factor: 1 },
    { text: (input.middleNotes || []).join(" "), factor: 1.2 },
    { text: (input.baseNotes || []).join(" "), factor: 1.3 },
  ].map((item) => ({
    ...item,
    text: removeMarketingWords(item.text),
  }));

  let hits = 0;
  for (const dimension of DIMENSIONS) {
    for (const [keyword, weight] of Object.entries(NOTE_WEIGHTS[dimension])) {
      for (const item of weightedText) {
        if (item.text.includes(keyword)) {
          const delta = weight * item.factor;
          scores[dimension] += delta;
          explain[dimension].push(`${keyword} +${delta.toFixed(1)}`);
          hits += 1;
        }
      }
    }
    scores[dimension] = Math.max(0, Math.min(10, Math.round(scores[dimension])));
  }

  return {
    scores,
    explain,
    confidence: hits >= 6 ? "high" : hits >= 3 ? "medium" : "low",
  };
}

function removeMarketingWords(text: string): string {
  return MARKETING_WORDS.reduce((acc, word) => acc.replaceAll(word, ""), text);
}
