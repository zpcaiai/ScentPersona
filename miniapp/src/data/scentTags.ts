import type { ScentTag, Locale } from "@/lib/scoring/types";

export const SCENT_TAGS: ScentTag[] = [
  "clean",
  "cold",
  "sweet",
  "woody",
  "soft",
  "presence",
  "sleep",
  "commute",
  "date",
  "gift",
  "spiritual",
  "bright",
  "mature",
  "cozy",
  "escape",
];

export const SCENT_TAG_LABELS: Record<ScentTag, string> = {
  clean: "干净",
  cold: "冷感",
  sweet: "甜感",
  woody: "木质",
  soft: "柔和",
  presence: "存在感",
  sleep: "睡前",
  commute: "通勤",
  date: "约会",
  gift: "送礼",
  spiritual: "精神",
  bright: "明亮",
  mature: "成熟",
  cozy: "温暖",
  escape: "逃离",
};

export const SCENT_TAG_LABELS_EN: Record<ScentTag, string> = {
  clean: "Clean",
  cold: "Cool",
  sweet: "Sweet",
  woody: "Woody",
  soft: "Soft",
  presence: "Presence",
  sleep: "Bedtime",
  commute: "Commute",
  date: "Date",
  gift: "Gifting",
  spiritual: "Meditative",
  bright: "Bright",
  mature: "Mature",
  cozy: "Cozy",
  escape: "Escape",
};

export const SCENT_TAG_DESCRIPTIONS: Record<ScentTag, string> = {
  clean: "像刚洗好的白衬衫，清爽不张扬",
  cold: "冷调、克制、有距离感",
  sweet: "甜美、温暖、有亲和力",
  woody: "木质调、沉稳、有深度",
  soft: "贴肤感、不刺鼻、温柔",
  presence: "有气场、容易被记住",
  sleep: "适合睡前、安静、放松",
  commute: "适合日常通勤、不突兀",
  date: "适合约会、有吸引力",
  gift: "适合送礼、接受度高",
  spiritual: "有精神感、适合冥想阅读",
  bright: "明亮、活泼、有能量",
  mature: "成熟、内敛、有阅历感",
  cozy: "温暖、舒适、有包裹感",
  escape: "逃离感、像在别处",
};

export const SCENT_TAG_DESCRIPTIONS_EN: Record<ScentTag, string> = {
  clean: "Like a freshly washed white shirt — crisp and understated",
  cold: "Cool, restrained, with a sense of distance",
  sweet: "Sweet, warm, and approachable",
  woody: "Woody, steady, and deep",
  soft: "Skin-close, gentle, never sharp",
  presence: "Commanding and easy to remember",
  sleep: "Calm and relaxing, good before bed",
  commute: "Easy for daily commutes, never out of place",
  date: "Attractive, good for a date",
  gift: "Widely liked, good for gifting",
  spiritual: "Meditative, good for reading and quiet time",
  bright: "Bright, lively, and full of energy",
  mature: "Mature, composed, and seasoned",
  cozy: "Warm, comforting, and enveloping",
  escape: "A sense of escape, like being somewhere else",
};

const LABELS_BY_LOCALE: Record<Locale, Record<ScentTag, string>> = {
  zh: SCENT_TAG_LABELS,
  en: SCENT_TAG_LABELS_EN,
};

const DESCRIPTIONS_BY_LOCALE: Record<Locale, Record<ScentTag, string>> = {
  zh: SCENT_TAG_DESCRIPTIONS,
  en: SCENT_TAG_DESCRIPTIONS_EN,
};

export function getScentTagLabels(locale: Locale = "zh"): Record<ScentTag, string> {
  return LABELS_BY_LOCALE[locale] ?? SCENT_TAG_LABELS;
}

export function getScentTagDescriptions(
  locale: Locale = "zh"
): Record<ScentTag, string> {
  return DESCRIPTIONS_BY_LOCALE[locale] ?? SCENT_TAG_DESCRIPTIONS;
}

export function getScentTagLabel(tag: ScentTag, locale: Locale = "zh"): string {
  return getScentTagLabels(locale)[tag];
}

export function getScentTagDescription(tag: ScentTag, locale: Locale = "zh"): string {
  return getScentTagDescriptions(locale)[tag];
}
