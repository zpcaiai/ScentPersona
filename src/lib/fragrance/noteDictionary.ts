import type { ScentDimension } from "./types";

export const NOTE_WEIGHTS: Record<ScentDimension, Record<string, number>> = {
  clean: { 白茶: 3, 皂感: 3, 白麝香: 2, 柑橘: 2, 清新: 2, 干净: 3, 海盐: 2 },
  soft: { 奶香: 3, 米香: 3, 香草: 2, 橙花: 2, 白花: 2, 柔和: 2, 麝香: 2 },
  woody: { 雪松: 3, 檀香: 3, 木质: 3, 纸张: 2, 茶: 2, 广藿香: 2, 橡木: 2 },
  bright: { 柑橘: 3, 桃子: 2, 梨: 2, 荔枝: 2, 葡萄柚: 3, 阳光: 2, 果香: 2 },
  presence: { 琥珀: 3, 皮革: 3, 烟草: 3, 焚香: 3, 浓郁: 2, 留香: 2, 气场: 2 },
  calm: { 茶: 3, 纸张: 2, 乳香: 3, 没药: 3, 橄榄木: 3, 雨后: 2, 安静: 2, 禅意: 2 },
};

export const MARKETING_WORDS = ["正品", "包邮", "限时", "热卖", "女神同款", "送礼", "官方", "旗舰"];
