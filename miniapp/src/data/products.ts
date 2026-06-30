import type { ScentTag, PersonaId, Locale } from "@/lib/scoring/types";

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  category: "perfume" | "diffuser" | "candle" | "spray" | "sample";
  personaFit: PersonaId[];
  scentTags: Record<ScentTag, number>;
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  plainDescription: string;
  professionalDescription: string;
  emotionalScene: string;
  suitableFor: string[];
  notSuitableFor: string[];
  useCases: string[];
  price: {
    sample?: number;
    fullSize?: number;
    giftBox?: number;
  };
  ctaText: string;
  image: string;
}

const zeroTags = (): Record<ScentTag, number> => ({
  clean: 0, cold: 0, sweet: 0, woody: 0, soft: 0, presence: 0,
  sleep: 0, commute: 0, date: 0, gift: 0, spiritual: 0,
  bright: 0, mature: 0, cozy: 0, escape: 0,
});

export const PRODUCTS: Product[] = [
  {
    id: "white-tea-morning",
    name: "白茶清晨",
    slug: "white-tea-morning",
    image: "/products/white-tea-morning.jpg",
    shortName: "白茶清晨",
    category: "perfume",
    personaFit: ["white-shirt-morning", "rain-study", "cool-black"],
    scentTags: {
      ...zeroTags(),
      clean: 9, cold: 5, soft: 7, commute: 8, bright: 6, sweet: 2,
    },
    notes: {
      top: ["白茶", "佛手柑", "晨露"],
      middle: ["茉莉", "鸢尾"],
      base: ["白麝香", "雪松"],
    },
    plainDescription: "像刚洗好的白衬衫，干净、清爽、不张扬。适合日常通勤和不想被注意到的日子。",
    professionalDescription: "以白茶和佛手柑开场，中调融入茉莉与鸢尾的清雅，尾调白麝香与雪松收束，整体呈现干净贴肤的皂感香气。",
    emotionalScene: "清晨七点，阳光刚照进房间。你穿好白衬衫，喝了一口温水，准备出门。这一刻的味道。",
    suitableFor: ["日常通勤", "初次约会", "不想太有存在感的日子", "夏天"],
    notSuitableFor: ["想要强烈印象的场合", "冬天深夜晚间"],
    useCases: ["办公室", "约会前", "出门前"],
    price: { sample: 2990, fullSize: 29800 },
    ctaText: "试一试白茶清晨",
  },
  {
    id: "rain-study",
    name: "雨后书房",
    slug: "rain-study",
    image: "/products/rain-study.jpg",
    shortName: "雨后书房",
    category: "perfume",
    personaFit: ["rain-study", "cool-black", "olive-rest"],
    scentTags: {
      ...zeroTags(),
      woody: 8, cold: 6, clean: 5, spiritual: 7, mature: 6, escape: 5,
    },
    notes: {
      top: ["雨后空气", "绿叶"],
      middle: ["纸张", "雪松", "檀香"],
      base: ["琥珀", "广藿香"],
    },
    plainDescription: "像走进一间雨后的书房，空气里有纸张和木头的味道。安静、克制，靠近后才有故事。",
    professionalDescription: "前调模拟雨后空气的清新绿意，中调以纸张和雪松构建书房质感，尾调琥珀与广藿香增添沉稳深度。",
    emotionalScene: "下雨的下午，你一个人坐在书房里。窗外是雨声，手边是一杯茶和一本旧书。空气是安静的。",
    suitableFor: ["阅读", "独处", "工作", "雨天", "冥想"],
    notSuitableFor: ["热闹聚会", "想要甜美感的场合"],
    useCases: ["书房", "办公室", "睡前"],
    price: { sample: 2990, fullSize: 32800 },
    ctaText: "试一试雨后书房",
  },
  {
    id: "warm-sweater",
    name: "暖灯毛衣",
    slug: "warm-sweater",
    image: "/products/warm-sweater.jpg",
    shortName: "暖灯毛衣",
    category: "perfume",
    personaFit: ["warm-sweater", "olive-rest", "midnight-cabin"],
    scentTags: {
      ...zeroTags(),
      cozy: 9, soft: 8, sleep: 7, sweet: 4, woody: 4, spiritual: 4,
    },
    notes: {
      top: ["琥珀", "暖姜"],
      middle: ["羊绒", "香草"],
      base: ["檀香", "麝香"],
    },
    plainDescription: "像裹着一件暖和的毛衣，坐在暖灯下。温柔、有包裹感，适合睡前和疲惫的一天结束时。",
    professionalDescription: "琥珀与暖姜构建温暖开场，中调羊绒与香草营造贴肤温柔感，尾调檀香与麝香让香气安静沉淀。",
    emotionalScene: "冬天晚上十点，你洗完澡，穿上最喜欢的毛衣，关掉大灯只留一盏暖灯。这一刻的味道。",
    suitableFor: ["睡前", "放松", "冬天", "在家", "疲惫的一天结束时"],
    notSuitableFor: ["夏天户外", "需要清醒专注的场合"],
    useCases: ["卧室", "睡前", "周末在家"],
    price: { sample: 2990, fullSize: 32800 },
    ctaText: "试一试暖灯毛衣",
  },
  {
    id: "midnight-cabin",
    name: "深夜木屋",
    slug: "midnight-cabin",
    image: "/products/midnight-cabin.jpg",
    shortName: "深夜木屋",
    category: "perfume",
    personaFit: ["midnight-cabin", "cool-black", "city-escape"],
    scentTags: {
      ...zeroTags(),
      woody: 10, presence: 7, mature: 8, cold: 4, escape: 6, spiritual: 5,
    },
    notes: {
      top: ["松木", "烟熏"],
      middle: ["雪松", "皮革"],
      base: ["檀香", "香根草", "琥珀"],
    },
    plainDescription: "像深夜走进一间山里的木屋，有壁炉的烟和木头的气息。深沉、有故事感、不适合所有人。",
    professionalDescription: "松木与烟熏构建深沉开场，中调雪松与皮革增添层次，尾调檀香与香根草让木质感持久沉淀。",
    emotionalScene: "深夜，你推开一扇木门。里面是壁炉、旧书和威士忌的味道。外面是雪和安静。",
    suitableFor: ["深秋", "冬天", "夜晚", "独处", "有阅历的人"],
    notSuitableFor: ["夏天", "白天通勤", "喜欢清新感的人"],
    useCases: ["夜晚", "独处", "约会"],
    price: { sample: 2990, fullSize: 35800 },
    ctaText: "试一试深夜木屋",
  },
  {
    id: "orchard-sunshine",
    name: "果园阳光",
    slug: "orchard-sunshine",
    image: "/products/orchard-sunshine.jpg",
    shortName: "果园阳光",
    category: "perfume",
    personaFit: ["orchard-sunshine", "city-escape"],
    scentTags: {
      ...zeroTags(),
      sweet: 8, bright: 9, presence: 5, date: 7, gift: 6, commute: 4,
    },
    notes: {
      top: ["柑橘", "桃子", "佛手柑"],
      middle: ["橙花", "茉莉"],
      base: ["麝香", "檀香"],
    },
    plainDescription: "像走进阳光下的果园，空气里有柑橘和桃子的甜。明亮、活泼、让人心情好。",
    professionalDescription: "柑橘与桃子构建明亮果香开场，中调橙花与茉莉增添花香层次，尾调麝香与檀香让甜感柔和收束。",
    emotionalScene: "周末下午，你走进一片果园。阳光照在脸上，空气里有水果的甜和花的香。你笑了。",
    suitableFor: ["春夏", "约会", "聚会", "心情好的日子", "送礼"],
    notSuitableFor: ["不喜欢甜感的人", "深冬", "正式商务场合"],
    useCases: ["约会", "聚会", "出门"],
    price: { sample: 2990, fullSize: 29800 },
    ctaText: "试一试果园阳光",
  },
  {
    id: "olive-rest",
    name: "橄榄山安息",
    slug: "olive-rest",
    image: "/products/olive-rest.jpg",
    shortName: "橄榄山安息",
    category: "perfume",
    personaFit: ["olive-rest", "rain-study", "warm-sweater"],
    scentTags: {
      ...zeroTags(),
      spiritual: 10, sleep: 8, soft: 7, woody: 5, escape: 7, cozy: 5,
    },
    notes: {
      top: ["橄榄叶", "无花果"],
      middle: ["乳香", "没药"],
      base: ["檀香", "琥珀", "麝香"],
    },
    plainDescription: "像在一座安静的山上，风里有橄榄树的味道。有精神感，适合冥想、阅读和睡前仪式。",
    professionalDescription: "橄榄叶与无花果构建绿意开场，中调乳香与没药带来精神深度，尾调檀香与琥珀让香气安静沉淀。",
    emotionalScene: "黄昏时分，你坐在山顶。风里有橄榄树和无花果的味道。世界很安静，你也是。",
    suitableFor: ["冥想", "阅读", "睡前", "独处", "需要安静的时刻"],
    notSuitableFor: ["热闹场合", "需要活力的早晨"],
    useCases: ["睡前", "冥想", "阅读"],
    price: { sample: 2990, fullSize: 35800 },
    ctaText: "试一试橄榄山安息",
  },
];

type ProductText = Pick<
  Product,
  | "name"
  | "shortName"
  | "notes"
  | "plainDescription"
  | "professionalDescription"
  | "emotionalScene"
  | "suitableFor"
  | "notSuitableFor"
  | "useCases"
  | "ctaText"
>;

const PRODUCT_TEXT_EN: Record<string, ProductText> = {
  "white-tea-morning": {
    name: "White Tea Morning",
    shortName: "White Tea Morning",
    notes: {
      top: ["White tea", "Bergamot", "Morning dew"],
      middle: ["Jasmine", "Iris"],
      base: ["White musk", "Cedar"],
    },
    plainDescription:
      "Like a freshly washed white shirt — clean, crisp, and understated. Good for daily commutes and days you'd rather go unnoticed.",
    professionalDescription:
      "Opens with white tea and bergamot, a heart of delicate jasmine and iris, closing on white musk and cedar — a clean, skin-close, soapy whole.",
    emotionalScene:
      "Seven in the morning, sunlight just reaching the room. You put on a white shirt, sip some warm water, and get ready to leave. The scent of that moment.",
    suitableFor: ["Daily commute", "First dates", "Days you'd rather not stand out", "Summer"],
    notSuitableFor: ["Occasions where you want a strong impression", "Winter late nights"],
    useCases: ["The office", "Before a date", "Before heading out"],
    ctaText: "Try White Tea Morning",
  },
  "rain-study": {
    name: "Rainy Study",
    shortName: "Rainy Study",
    notes: {
      top: ["After-rain air", "Green leaves"],
      middle: ["Paper", "Cedar", "Sandalwood"],
      base: ["Amber", "Patchouli"],
    },
    plainDescription:
      "Like stepping into a study after the rain, the air full of paper and wood. Quiet and restrained — the story opens up close.",
    professionalDescription:
      "The top recreates the fresh green of after-rain air, the heart builds a study's texture with paper and cedar, and amber and patchouli add grounded depth at the base.",
    emotionalScene:
      "A rainy afternoon, you sit alone in the study. Rain outside the window, a cup of tea and an old book at hand. The air is quiet.",
    suitableFor: ["Reading", "Solitude", "Work", "Rainy days", "Meditation"],
    notSuitableFor: ["Lively parties", "Occasions calling for sweetness"],
    useCases: ["The study", "The office", "Before bed"],
    ctaText: "Try Rainy Study",
  },
  "warm-sweater": {
    name: "Warm Sweater",
    shortName: "Warm Sweater",
    notes: {
      top: ["Amber", "Warm ginger"],
      middle: ["Cashmere", "Vanilla"],
      base: ["Sandalwood", "Musk"],
    },
    plainDescription:
      "Like wrapping up in a warm sweater under a soft lamp. Gentle and enveloping — made for bedtime and the end of a tiring day.",
    professionalDescription:
      "Amber and warm ginger build a cozy opening, cashmere and vanilla create a soft, skin-close heart, and sandalwood and musk let the scent settle quietly at the base.",
    emotionalScene:
      "Ten on a winter night, fresh out of the shower, you pull on your favorite sweater and turn off the lights but for one warm lamp. The scent of that moment.",
    suitableFor: ["Bedtime", "Unwinding", "Winter", "At home", "The end of a tiring day"],
    notSuitableFor: ["Summer outdoors", "When you need to stay sharp and focused"],
    useCases: ["The bedroom", "Before bed", "Weekends at home"],
    ctaText: "Try Warm Sweater",
  },
  "midnight-cabin": {
    name: "Midnight Cabin",
    shortName: "Midnight Cabin",
    notes: {
      top: ["Pine", "Smoke"],
      middle: ["Cedar", "Leather"],
      base: ["Sandalwood", "Vetiver", "Amber"],
    },
    plainDescription:
      "Like stepping into a mountain cabin at midnight, the air full of fireplace smoke and wood. Deep and story-worn — not for everyone.",
    professionalDescription:
      "Pine and smoke build a deep opening, cedar and leather add layers in the heart, and sandalwood and vetiver give the woods a long, settled base.",
    emotionalScene:
      "Late at night, you push open a wooden door. Inside: fireplace, old books, and whisky. Outside: snow and silence.",
    suitableFor: ["Late autumn", "Winter", "Night", "Solitude", "People with some history behind them"],
    notSuitableFor: ["Summer", "Daytime commutes", "People who like fresh scents"],
    useCases: ["Night", "Solitude", "Dates"],
    ctaText: "Try Midnight Cabin",
  },
  "orchard-sunshine": {
    name: "Orchard Sunshine",
    shortName: "Orchard Sunshine",
    notes: {
      top: ["Citrus", "Peach", "Bergamot"],
      middle: ["Neroli", "Jasmine"],
      base: ["Musk", "Sandalwood"],
    },
    plainDescription:
      "Like walking into a sunlit orchard, the air sweet with citrus and peach. Bright, lively, and mood-lifting.",
    professionalDescription:
      "Citrus and peach build a bright fruity opening, neroli and jasmine add floral layers in the heart, and musk and sandalwood soften the sweetness to a close.",
    emotionalScene:
      "A weekend afternoon, you walk into an orchard. Sun on your face, the air sweet with fruit and flowers. You smile.",
    suitableFor: ["Spring & summer", "Dates", "Parties", "Good-mood days", "Gifting"],
    notSuitableFor: ["People who dislike sweetness", "Deep winter", "Formal business settings"],
    useCases: ["Dates", "Parties", "Going out"],
    ctaText: "Try Orchard Sunshine",
  },
  "olive-rest": {
    name: "Olive Hill Rest",
    shortName: "Olive Hill Rest",
    notes: {
      top: ["Olive leaf", "Fig"],
      middle: ["Frankincense", "Myrrh"],
      base: ["Sandalwood", "Amber", "Musk"],
    },
    plainDescription:
      "Like being on a quiet hilltop, the wind carrying olive trees. Meditative — made for meditation, reading, and a bedtime ritual.",
    professionalDescription:
      "Olive leaf and fig build a green opening, frankincense and myrrh bring meditative depth in the heart, and sandalwood and amber let the scent settle quietly at the base.",
    emotionalScene:
      "At dusk, you sit on a hilltop. The wind smells of olive trees and figs. The world is quiet, and so are you.",
    suitableFor: ["Meditation", "Reading", "Bedtime", "Solitude", "Moments that call for quiet"],
    notSuitableFor: ["Lively occasions", "Mornings that need energy"],
    useCases: ["Before bed", "Meditation", "Reading"],
    ctaText: "Try Olive Hill Rest",
  },
};

function localizeProduct(product: Product, locale: Locale): Product {
  if (locale === "en") {
    const text = PRODUCT_TEXT_EN[product.id];
    if (text) return { ...product, ...text };
  }
  return product;
}

export function getProducts(locale: Locale = "zh"): Product[] {
  return PRODUCTS.map((p) => localizeProduct(p, locale));
}

export function getProductById(id: string, locale: Locale = "zh"): Product | undefined {
  const product = PRODUCTS.find((p) => p.id === id);
  return product ? localizeProduct(product, locale) : undefined;
}

export function getProductBySlug(slug: string, locale: Locale = "zh"): Product | undefined {
  const product = PRODUCTS.find((p) => p.slug === slug);
  return product ? localizeProduct(product, locale) : undefined;
}
