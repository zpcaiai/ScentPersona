/**
 * Cosmetic / fragrance claim compliance (Skill 43). Pure.
 * Flags medical / sleep / absolute-safety overclaims and suggests compliant copy.
 */
export interface ClaimFlag {
  flag: string;
  matched: string;
  suggestion: string;
}

const RULES: { term: RegExp; flag: string; suggestion: string }[] = [
  { term: /治疗焦虑|抗焦虑/g, flag: "anxiety_treatment_claim", suggestion: "放松氛围" },
  { term: /改善失眠|助眠|促进睡眠|保证入睡|秒睡/g, flag: "sleep_treatment_claim", suggestion: "睡前仪式感" },
  { term: /缓解抑郁|抗抑郁|治愈抑郁/g, flag: "medical_claim", suggestion: "让心情轻一点" },
  { term: /医学级|医用级|药用/g, flag: "medical_claim", suggestion: "用心配比" },
  { term: /绝对安全|百分百安全|100%安全|零风险/g, flag: "fake_safety_claim", suggestion: "温和配方，使用前建议局部测试" },
  { term: /无过敏|不过敏|零过敏|不致敏/g, flag: "allergen_claim", suggestion: "敏感肌建议先局部测试" },
  { term: /永久留香|一喷一整天|持久一整天保证/g, flag: "overclaim", suggestion: "留香相对持久（因人而异）" },
  { term: /包治|根治|疗效|功效显著/g, flag: "medical_claim", suggestion: "带来放松的氛围" },
];

export function checkClaims(text: string | null | undefined): {
  ok: boolean;
  flags: ClaimFlag[];
  sanitized: string;
} {
  const src = text ?? "";
  const flags: ClaimFlag[] = [];
  let sanitized = src;
  for (const rule of RULES) {
    const matches = src.match(rule.term);
    if (matches) {
      for (const m of matches) flags.push({ flag: rule.flag, matched: m, suggestion: rule.suggestion });
      sanitized = sanitized.replace(rule.term, rule.suggestion);
    }
  }
  return { ok: flags.length === 0, flags, sanitized };
}
