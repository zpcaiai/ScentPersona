const MARKETING_WORDS = [
  "正品",
  "包邮",
  "限时",
  "热卖",
  "女神同款",
  "送礼",
  "官方",
  "旗舰",
  "旗舰店",
  "爆款",
  "专柜",
  "礼物",
];

export function normalizeTitle(title: string): string {
  let normalized = title.toLowerCase().replace(/[【】()[\]{}]/g, " ");
  for (const word of MARKETING_WORDS) {
    normalized = normalized.replaceAll(word.toLowerCase(), " ");
  }
  return normalized
    .replace(/[^\p{L}\p{N}.毫升ml香水淡香精香精小样试管分装礼盒套装]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeTitle(title: string): string[] {
  return normalizeTitle(title)
    .split(/\s+/)
    .flatMap((token) => token.split(/(?=[\u4e00-\u9fa5])/u))
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}
