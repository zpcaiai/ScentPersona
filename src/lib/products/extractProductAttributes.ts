import { normalizeTitle } from "./normalizeTitle";
import type { ExtractedProductAttributes } from "./types";

const BRAND_ALIASES: Record<string, string> = {
  chanel: "CHANEL",
  香奈儿: "CHANEL",
  dior: "DIOR",
  迪奥: "DIOR",
  jo: "Jo Malone",
  祖玛珑: "Jo Malone",
  lelabo: "Le Labo",
  "le labo": "Le Labo",
};

const NOTE_WORDS = ["白茶", "柑橘", "白麝香", "雪松", "檀香", "茶", "纸张", "琥珀", "玫瑰", "橙花", "香草", "海盐", "广藿香", "焚香"];

export function extractProductAttributes(title: string, description = ""): ExtractedProductAttributes {
  const source = `${title} ${description}`;
  const normalized = normalizeTitle(source);
  const volumeMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:ml|毫升)/i);
  const volumeMl = volumeMatch ? Math.round(Number(volumeMatch[1])) : undefined;
  const concentration = extractConcentration(normalized);
  const brand = Object.entries(BRAND_ALIASES).find(([key]) => normalized.includes(key.toLowerCase()))?.[1];
  const notes = NOTE_WORDS.filter((note) => source.includes(note));

  return {
    brand,
    productName: normalizeTitle(title).replace(/\d+(?:\.\d+)?\s*(?:ml|毫升)/gi, "").trim(),
    concentration,
    volumeMl,
    gender: /男士|男香/.test(source) ? "male" : /女士|女香/.test(source) ? "female" : undefined,
    isSample: /小样|试管|体验装/.test(source),
    isGiftBox: /礼盒|套装|套盒/.test(source),
    isTester: /tester|测试装/i.test(source),
    isDecant: /分装|分装香/.test(source),
    scentFamily: notes.slice(0, 3).join(" "),
    notes,
  };
}

function extractConcentration(text: string): string | undefined {
  if (/淡香精|edp/i.test(text)) return "EDP";
  if (/淡香水|edt/i.test(text)) return "EDT";
  if (/parfum|香精/i.test(text)) return "Parfum";
  return undefined;
}
