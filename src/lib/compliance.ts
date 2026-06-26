const riskyTerms: string[] = [
  "治疗焦虑",
  "治愈焦虑",
  "改善失眠",
  "治疗失眠",
  "缓解抑郁",
  "抗抑郁",
  "医学级",
  "药用",
  "保证入睡",
  "100%有效",
  "永久留香",
  "无过敏",
  "绝对安全",
  "治疗抑郁症",
  "治愈失眠",
  "包治",
  "疗效",
];

const saferAlternatives: Record<string, string> = {
  治疗焦虑: "营造安静的睡前氛围",
  治愈焦虑: "陪你慢慢回到平静",
  改善失眠: "建立睡前仪式感",
  治疗失眠: "让房间先安静下来",
  缓解抑郁: "陪你慢慢回到稳定状态",
  抗抑郁: "给情绪一个温柔的出口",
  医学级: "精心调配",
  药用: "日常使用",
  保证入睡: "让房间先安静下来",
  "100%有效": "用心为你匹配",
  永久留香: "留香持久",
  无过敏: "使用前建议先进行局部测试",
  绝对安全: "温和配方，建议先试香",
  治疗抑郁症: "陪你慢慢回到稳定状态",
  治愈失眠: "建立睡前仪式感",
  包治: "陪伴",
  疗效: "体验",
};

export interface RiskyClaim {
  term: string;
  index: number;
}

export function findRiskyClaims(text: string): RiskyClaim[] {
  const claims: RiskyClaim[] = [];
  for (const term of riskyTerms) {
    let idx = text.indexOf(term);
    while (idx !== -1) {
      claims.push({ term, index: idx });
      idx = text.indexOf(term, idx + term.length);
    }
  }
  return claims.sort((a, b) => a.index - b.index);
}

export function suggestSafeCopy(text: string): string {
  let result = text;
  for (const term of riskyTerms) {
    const replacement = saferAlternatives[term];
    if (replacement) {
      result = result.replaceAll(term, replacement);
    }
  }
  return result;
}

export function assertSafeCopy(text: string): {
  safe: boolean;
  risks: string[];
  suggestion: string;
} {
  const claims = findRiskyClaims(text);
  const risks = [...new Set(claims.map((c) => c.term))];
  return {
    safe: risks.length === 0,
    risks,
    suggestion: suggestSafeCopy(text),
  };
}
