import type { PersonaId, ScentTag } from "@/lib/scoring/types";

export interface Persona {
  id: PersonaId;
  name: string;
  slug: string;
  title: string;
  keywords: string[];
  description: string;
  primaryTags: ScentTag[];
  avoidTags: ScentTag[];
  idealScenes: string[];
  recommendedProductIds: string[];
  shareLine: string;
  reportSections: {
    identity: string;
    scentDirection: string;
    avoid: string;
    scenes: string;
    closing: string;
  };
}

export const PERSONAS: Persona[] = [
  {
    id: "white-shirt-morning",
    name: "白衬衫清晨型",
    slug: "white-shirt-morning",
    title: "干净、清爽、不需要被记住",
    keywords: ["干净", "清爽", "日常", "不张扬"],
    description: "你喜欢干净、不复杂的东西。不需要太多装饰，简单就好。你的气味应该是那种「闻起来很舒服但不会抢戏」的类型。",
    primaryTags: ["clean", "commute", "soft", "bright"],
    avoidTags: ["presence", "sweet"],
    idealScenes: ["通勤", "日常", "初次见面", "夏天"],
    recommendedProductIds: ["white-tea-morning"],
    shareLine: "我是白衬衫清晨型。干净、不张扬，靠近才知道好。",
    reportSections: {
      identity: "你是一个喜欢「刚刚好」的人。不需要太多，不需要太浓，干净就好。你的气味人格是清晨的白衬衫——简单、清爽、让人觉得舒服。",
      scentDirection: "你适合干净、贴肤、有皂感的香气。白茶、麝香、佛手柑是你的方向。避开太甜或太浓的味道。",
      avoid: "太甜的果香、太浓的东方调可能不太适合你当前状态。不是不好闻，是和你「不太像」。",
      scenes: "日常通勤、初次约会、不想太有存在感的日子。你的香是给自己闻的，不是给别人闻的。",
      closing: "你不需要用气味证明什么。干净，就是你的存在感。",
    },
  },
  {
    id: "rain-study",
    name: "雨后书房型",
    slug: "rain-study",
    title: "安静、克制、靠近后才有故事",
    keywords: ["安静", "克制", "木质", "有深度"],
    description: "你享受独处，喜欢安静的环境。不需要热闹，一本书一杯茶就够了。你的气味应该有木质感，像雨后的书房。",
    primaryTags: ["woody", "spiritual", "cold", "mature"],
    avoidTags: ["sweet", "bright"],
    idealScenes: ["阅读", "独处", "工作", "雨天"],
    recommendedProductIds: ["rain-study"],
    shareLine: "我是雨后书房型。安静、克制，靠近后才有故事。",
    reportSections: {
      identity: "你是一个享受独处的人。不需要太多社交，一个人的时候反而最自在。你的气味人格是雨后的书房——安静、有深度、靠近才知道好。",
      scentDirection: "你适合木质调、有纸张感、冷一点的香气。雪松、檀香、雨后空气是你的方向。避开太甜太亮的味道。",
      avoid: "甜美的果香、太活泼的花香可能不太适合你当前状态。你喜欢的是有故事感的味道，不是讨喜的味道。",
      scenes: "阅读、独处、工作、雨天。你的香是安静空间里的背景音，不抢戏，但缺了就觉得空。",
      closing: "你不需要被很多人理解。懂你的人，靠近就好。",
    },
  },
  {
    id: "warm-sweater",
    name: "暖灯毛衣型",
    slug: "warm-sweater",
    title: "温柔、有包裹感、适合睡前",
    keywords: ["温暖", "柔和", "睡前", "舒适"],
    description: "你重视舒适和安全感。喜欢被包裹的感觉，疲惫的一天需要一个温柔的结束。你的气味应该是暖的、柔的。",
    primaryTags: ["cozy", "soft", "sleep", "spiritual"],
    avoidTags: ["cold", "presence"],
    idealScenes: ["睡前", "在家", "冬天", "放松"],
    recommendedProductIds: ["warm-sweater"],
    shareLine: "我是暖灯毛衣型。温柔、有包裹感，给疲惫的一天一个结束仪式。",
    reportSections: {
      identity: "你是一个重视舒适感的人。家对你来说很重要，一天的结束需要一个温柔的仪式。你的气味人格是冬天的暖灯和毛衣——温暖、柔和、让人觉得安全。",
      scentDirection: "你适合温暖、贴肤、有包裹感的香气。琥珀、香草、檀香、麝香是你的方向。避开太冷太锋利的味道。",
      avoid: "冷感十足的柑橘调、太有气场的东方调可能不太适合你当前状态。你需要的是被包裹，不是被注目。",
      scenes: "睡前、在家、冬天、疲惫的一天结束时。你的香是给房间和自己的一句「辛苦了」。",
      closing: "你值得一个温柔的结束。让房间先安静下来。",
    },
  },
  {
    id: "midnight-cabin",
    name: "深夜木屋型",
    slug: "midnight-cabin",
    title: "深沉、有故事感、不适合所有人",
    keywords: ["深沉", "木质", "成熟", "有故事"],
    description: "你有超出年龄的沉稳。喜欢有深度的事物，不追求大众审美。你的气味应该深沉、有木质感、有故事。",
    primaryTags: ["woody", "mature", "presence", "escape"],
    avoidTags: ["sweet", "bright", "commute"],
    idealScenes: ["夜晚", "独处", "深秋", "冬天"],
    recommendedProductIds: ["midnight-cabin"],
    shareLine: "我是深夜木屋型。深沉、有故事感，不适合所有人。",
    reportSections: {
      identity: "你是一个有故事感的人。不需要被所有人喜欢，懂的人自然懂。你的气味人格是深夜的木屋——深沉、有阅历、不讨好任何人。",
      scentDirection: "你适合深沉的木质调、烟熏感、皮革调。松木、雪松、檀香、香根草是你的方向。避开太甜太清新的味道。",
      avoid: "甜美的果香、清新的花香可能不太适合你当前状态。你要的是深度，不是讨好。",
      scenes: "夜晚、独处、深秋和冬天。你的香是深夜独饮时的背景音，不需要陪伴，但需要氛围。",
      closing: "不是所有人都能读懂你。但被读懂的时候，就够了。",
    },
  },
  {
    id: "orchard-sunshine",
    name: "果园阳光型",
    slug: "orchard-sunshine",
    title: "明亮、活泼、让人心情好",
    keywords: ["明亮", "甜美", "活泼", "有亲和力"],
    description: "你是一个让人靠近就觉得开心的人。喜欢阳光、喜欢热闹、喜欢甜的东西。你的气味应该是明亮的、有亲和力的。",
    primaryTags: ["sweet", "bright", "date", "gift"],
    avoidTags: ["cold", "woody", "mature"],
    idealScenes: ["约会", "聚会", "春夏", "心情好的日子"],
    recommendedProductIds: ["orchard-sunshine"],
    shareLine: "我是果园阳光型。明亮、活泼，让人靠近就心情好。",
    reportSections: {
      identity: "你是一个自带能量的人。靠近你就觉得开心，像走进阳光下的果园。你的气味人格是明亮、甜美、让人心情好。",
      scentDirection: "你适合明亮的果香、清甜的花香。柑橘、桃子、橙花、茉莉是你的方向。避开太冷太深沉的味道。",
      avoid: "深沉的木质调、冷感的东方调可能不太适合你当前状态。你要的是阳光，不是深夜。",
      scenes: "约会、聚会、春夏、心情好的日子。你的香是让人想靠近的理由。",
      closing: "你本身就是阳光。气味只是让更多人闻到而已。",
    },
  },
  {
    id: "cool-black",
    name: "冷感黑衣型",
    slug: "cool-black",
    title: "冷、克制、有距离感",
    keywords: ["冷感", "克制", "有距离感", "有气场"],
    description: "你给人第一印象是冷的、有距离感的。但靠近后发现并不冷漠，只是不轻易热络。你的气味应该是冷的、克制的。",
    primaryTags: ["cold", "presence", "mature", "clean"],
    avoidTags: ["sweet", "cozy"],
    idealScenes: ["通勤", "正式场合", "夜晚", "约会"],
    recommendedProductIds: ["white-tea-morning", "rain-study"],
    shareLine: "我是冷感黑衣型。冷、克制、有距离感，但靠近后并不冷漠。",
    reportSections: {
      identity: "你是一个给人距离感的人。不是因为冷漠，是因为不轻易热络。你的气味人格是冷感黑衣——克制、有气场、靠近后才知道温度。",
      scentDirection: "你适合冷调、干净、有存在感的香气。白茶、雪松、鸢尾是你的方向。避开太甜太暖的味道。",
      avoid: "甜美的果香、太暖的美食调可能不太适合你当前状态。你要的是距离感中的吸引力，不是讨好。",
      scenes: "通勤、正式场合、夜晚、约会。你的香是黑色大衣的味道——冷，但让人想靠近。",
      closing: "你的冷不是拒绝，是筛选。懂你的人，会主动靠近。",
    },
  },
  {
    id: "olive-rest",
    name: "橄榄山安息型",
    slug: "olive-rest",
    title: "安静、有精神感、适合独处",
    keywords: ["安静", "精神", "冥想", "睡前"],
    description: "你需要安静的空间来恢复能量。冥想、阅读、独处是你的充电方式。你的气味应该有精神感，像山上的风。",
    primaryTags: ["spiritual", "sleep", "soft", "escape"],
    avoidTags: ["presence", "bright", "sweet"],
    idealScenes: ["冥想", "阅读", "睡前", "独处"],
    recommendedProductIds: ["olive-rest", "warm-sweater"],
    shareLine: "我是橄榄山安息型。安静、有精神感，在独处中找到自己。",
    reportSections: {
      identity: "你是一个需要安静来恢复能量的人。热闹可以，但独处才是充电。你的气味人格是橄榄山上的风——安静、有精神感、让人回到自己。",
      scentDirection: "你适合有精神感的香气。乳香、没药、橄榄叶、檀香是你的方向。避开太甜太有存在感的味道。",
      avoid: "明亮的果香、太有气场的东方调可能不太适合你当前状态。你需要的是回到安静，不是被注目。",
      scenes: "冥想、阅读、睡前、独处。你的香是让世界安静下来的开关。",
      closing: "在安静中，你找到了自己。气味只是陪你回到那个安静的地方。",
    },
  },
  {
    id: "city-escape",
    name: "城市逃离型",
    slug: "city-escape",
    title: "想离开、想呼吸、想在别处",
    keywords: ["逃离", "自由", "自然", "不想被定义"],
    description: "你经常想离开城市，去一个没有天花板的地方。不需要计划，只想呼吸。你的气味应该有逃离感，像在别处。",
    primaryTags: ["escape", "bright", "woody", "spiritual"],
    avoidTags: ["commute", "mature"],
    idealScenes: ["周末", "旅行", "户外", "需要喘口气的日子"],
    recommendedProductIds: ["orchard-sunshine", "midnight-cabin"],
    shareLine: "我是城市逃离型。想离开、想呼吸、想在别处。",
    reportSections: {
      identity: "你是一个经常想「逃离」的人。不是真的要走，是需要喘口气。你的气味人格是城市逃离——不想被定义，只想在别处待一会儿。",
      scentDirection: "你适合有自然感、有逃离感的香气。柑橘、绿叶、松木、雨后空气是你的方向。避开太都市太通勤的味道。",
      avoid: "太正式的通勤香、太甜美的约会香可能不太适合你当前状态。你要的是呼吸感，不是社交感。",
      scenes: "周末、旅行、户外、需要喘口气的日子。你的香是一张不目的地车票。",
      closing: "你不需要真的逃离。气味可以带你去一下「在别处」的感觉。",
    },
  },
];

export function getPersonaById(id: string): Persona | undefined {
  return PERSONAS.find((p) => p.id === id);
}
