export interface ExtractedProductAttributes {
  brand?: string;
  seriesName?: string;
  productName?: string;
  concentration?: string;
  volumeMl?: number;
  gender?: string;
  isSample: boolean;
  isGiftBox: boolean;
  isTester: boolean;
  isDecant: boolean;
  scentFamily?: string;
  notes: string[];
}

export interface ProductMatchResult {
  matchedProductId?: string;
  score: number;
  confidence: "high" | "medium" | "low";
  reason: string;
  needsReview: boolean;
}

export interface ProductLikeForMatch {
  id: string;
  normalizedName: string;
  brand: string | null;
  concentration: string | null;
  volumeMl: number | null;
  topNotesJson: string;
  middleNotesJson: string;
  baseNotesJson: string;
}
