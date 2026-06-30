/** Scent wardrobe scene-gap suggestions (Skill 53). Pure, advisory. */
export const WARDROBE_ROLES = ["commute", "date", "sleep", "work", "travel", "gift", "special", "home"] as const;
export type WardrobeRole = (typeof WARDROBE_ROLES)[number];

export const ROLE_LABELS: Record<WardrobeRole, string> = {
  commute: "通勤香", date: "约会香", sleep: "睡前香", work: "工作香",
  travel: "旅行香", gift: "送礼备选", special: "重要场合香", home: "家居香薰",
};

const PAIR_HINTS: { has: WardrobeRole; suggest: WardrobeRole; reason: string }[] = [
  { has: "commute", suggest: "date", reason: "你已有通勤香，要不要补一支约会香？" },
  { has: "sleep", suggest: "home", reason: "喜欢睡前香，也可以试试房间香薰。" },
  { has: "work", suggest: "special", reason: "工作之外，准备一支重要场合的香会更从容。" },
  { has: "date", suggest: "special", reason: "约会香之外，重要场合可以更有气场。" },
];

export function suggestNextScene(existingRoles: string[]): { role: WardrobeRole; reason: string }[] {
  const have = new Set(existingRoles);
  const out: { role: WardrobeRole; reason: string }[] = [];
  for (const h of PAIR_HINTS) {
    if (have.has(h.has) && !have.has(h.suggest) && !out.some((o) => o.role === h.suggest)) {
      out.push({ role: h.suggest, reason: h.reason });
    }
  }
  // If nearly empty, suggest the everyday staple.
  if (existingRoles.length === 0) {
    out.push({ role: "commute", reason: "先从一支日常通勤香开始，建立你的香味衣橱。" });
  }
  return out.slice(0, 3);
}
