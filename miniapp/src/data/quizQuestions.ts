import type { ScentTag, PersonaId, PartialTagScores, PartialPersonaScores } from "../lib/scoring/types";

export interface QuizOption {
  id: string;
  label: string;
  description?: string;
  tagScores: PartialTagScores;
  personaScores?: PartialPersonaScores;
}

export interface QuizQuestion {
  id: string;
  order: number;
  question: string;
  subtitle?: string;
  options: QuizOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    order: 1,
    question: "最近一周，你最常处于什么状态？",
    subtitle: "不用想太久，选最像你最近状态的那个。",
    options: [
      {
        id: "q1a",
        label: "忙碌但充实，每天停不下来",
        description: "工作或学习占了大半时间",
        tagScores: { commute: 3, presence: 2, clean: 1 },
        personaScores: { "white-shirt-morning": 2, "cool-black": 1 },
      },
      {
        id: "q1b",
        label: "有点累，想休息一下",
        description: "感觉需要喘口气",
        tagScores: { cozy: 3, soft: 2, sleep: 2 },
        personaScores: { "warm-sweater": 2, "olive-rest": 1 },
      },
      {
        id: "q1c",
        label: "平静，享受独处的时间",
        description: "一个人待着就很好",
        tagScores: { spiritual: 3, woody: 2, escape: 1 },
        personaScores: { "rain-study": 2, "olive-rest": 1 },
      },
      {
        id: "q1d",
        label: "想出去走走，换个环境",
        description: "有点闷，想透透气",
        tagScores: { escape: 3, bright: 2, sweet: 1 },
        personaScores: { "city-escape": 2, "orchard-sunshine": 1 },
      },
    ],
  },
  {
    id: "q2",
    order: 2,
    question: "如果让别人用三个词形容你，你最希望是？",
    options: [
      {
        id: "q2a",
        label: "干净、清爽、舒服",
        tagScores: { clean: 3, soft: 2, commute: 1 },
        personaScores: { "white-shirt-morning": 2 },
      },
      {
        id: "q2b",
        label: "安静、有深度、不简单",
        tagScores: { woody: 3, spiritual: 2, mature: 1 },
        personaScores: { "rain-study": 2, "midnight-cabin": 1 },
      },
      {
        id: "q2c",
        label: "温暖、温柔、让人安心",
        tagScores: { cozy: 3, soft: 2, sleep: 1 },
        personaScores: { "warm-sweater": 2 },
      },
      {
        id: "q2d",
        label: "有趣、有能量、让人想靠近",
        tagScores: { bright: 3, sweet: 2, date: 1 },
        personaScores: { "orchard-sunshine": 2 },
      },
    ],
  },
  {
    id: "q3",
    order: 3,
    question: "你最常在什么场景下用香氛？",
    options: [
      {
        id: "q3a",
        label: "出门前，上班或约会",
        tagScores: { commute: 3, clean: 2, presence: 1 },
        personaScores: { "white-shirt-morning": 1, "cool-black": 1 },
      },
      {
        id: "q3b",
        label: "在家，睡前或放松时",
        tagScores: { sleep: 3, cozy: 2, soft: 1 },
        personaScores: { "warm-sweater": 2, "olive-rest": 1 },
      },
      {
        id: "q3c",
        label: "阅读、冥想、独处时",
        tagScores: { spiritual: 3, woody: 2, escape: 1 },
        personaScores: { "rain-study": 1, "olive-rest": 1 },
      },
      {
        id: "q3d",
        label: "聚会、约会、出门玩",
        tagScores: { date: 3, bright: 2, sweet: 1, presence: 1 },
        personaScores: { "orchard-sunshine": 1, "city-escape": 1 },
      },
    ],
  },
  {
    id: "q4",
    order: 4,
    question: "下面哪个画面最让你心动？",
    options: [
      {
        id: "q4a",
        label: "清晨阳光照进房间，白衬衫挂在衣架上",
        tagScores: { clean: 3, bright: 2, commute: 1 },
        personaScores: { "white-shirt-morning": 2 },
      },
      {
        id: "q4b",
        label: "下雨的下午，书房里一杯茶和一本旧书",
        tagScores: { woody: 3, spiritual: 2, cold: 1, escape: 1 },
        personaScores: { "rain-study": 2 },
      },
      {
        id: "q4c",
        label: "冬夜，暖灯下一件毛衣和一部老电影",
        tagScores: { cozy: 3, soft: 2, sleep: 2 },
        personaScores: { "warm-sweater": 2 },
      },
      {
        id: "q4d",
        label: "阳光下的果园，空气里有水果的甜",
        tagScores: { sweet: 3, bright: 2, date: 1 },
        personaScores: { "orchard-sunshine": 2 },
      },
    ],
  },
  {
    id: "q5",
    order: 5,
    question: "什么样的味道体验让你最受不了？",
    options: [
      {
        id: "q5a",
        label: "太甜了，像走进糖果店",
        tagScores: { sweet: -3, cold: 1, clean: 1 },
        personaScores: { "cool-black": 1, "rain-study": 1 },
      },
      {
        id: "q5b",
        label: "太浓了，一整栋楼都闻得到",
        tagScores: { presence: -3, soft: 2, clean: 1 },
        personaScores: { "white-shirt-morning": 1, "warm-sweater": 1 },
      },
      {
        id: "q5c",
        label: "太冷了，像消毒水",
        tagScores: { cold: -2, cozy: 2, sweet: 1 },
        personaScores: { "warm-sweater": 1, "orchard-sunshine": 1 },
      },
      {
        id: "q5d",
        label: "太普通了，闻过就忘",
        tagScores: { escape: 2, woody: 1, spiritual: 1, mature: 1 },
        personaScores: { "midnight-cabin": 1, "city-escape": 1 },
      },
    ],
  },
  {
    id: "q6",
    order: 6,
    question: "你希望你的气味被多少人闻到？",
    options: [
      {
        id: "q6a",
        label: "只有靠近的人，不张扬",
        tagScores: { soft: 3, clean: 2, commute: 1 },
        personaScores: { "white-shirt-morning": 1, "warm-sweater": 1 },
      },
      {
        id: "q6b",
        label: "一屋子的人，但不会觉得刺鼻",
        tagScores: { presence: 2, soft: 2, gift: 1 },
        personaScores: { "orchard-sunshine": 1 },
      },
      {
        id: "q6c",
        label: "走进房间就有人注意到",
        tagScores: { presence: 3, mature: 2, date: 1 },
        personaScores: { "cool-black": 1, "midnight-cabin": 1 },
      },
      {
        id: "q6d",
        label: "只有自己闻到就够了",
        tagScores: { spiritual: 3, sleep: 2, escape: 1 },
        personaScores: { "olive-rest": 1, "rain-study": 1 },
      },
    ],
  },
  {
    id: "q7",
    order: 7,
    question: "买香氛时，你最看重什么？",
    options: [
      {
        id: "q7a",
        label: "日常百搭，不出错",
        tagScores: { commute: 3, clean: 2, soft: 1 },
        personaScores: { "white-shirt-morning": 1 },
      },
      {
        id: "q7b",
        label: "有故事感，不大众",
        tagScores: { woody: 3, mature: 2, escape: 1 },
        personaScores: { "rain-study": 1, "midnight-cabin": 1 },
      },
      {
        id: "q7c",
        label: "让心情变好，有氛围",
        tagScores: { cozy: 2, sleep: 2, spiritual: 2 },
        personaScores: { "warm-sweater": 1, "olive-rest": 1 },
      },
      {
        id: "q7d",
        label: "好闻就行，不用太复杂",
        tagScores: { sweet: 2, bright: 2, gift: 1 },
        personaScores: { "orchard-sunshine": 1 },
      },
    ],
  },
  {
    id: "q8",
    order: 8,
    question: "你的穿衣风格更接近哪种？",
    options: [
      {
        id: "q8a",
        label: "简洁干净，基本款为主",
        tagScores: { clean: 3, commute: 2, soft: 1 },
        personaScores: { "white-shirt-morning": 2 },
      },
      {
        id: "q8b",
        label: "深色系，有一点冷感",
        tagScores: { cold: 3, presence: 2, mature: 1 },
        personaScores: { "cool-black": 2, "midnight-cabin": 1 },
      },
      {
        id: "q8c",
        label: "舒适为主，柔软宽松",
        tagScores: { cozy: 3, soft: 2, sleep: 1 },
        personaScores: { "warm-sweater": 2 },
      },
      {
        id: "q8d",
        label: "颜色丰富，有个性",
        tagScores: { bright: 3, sweet: 2, date: 1, escape: 1 },
        personaScores: { "orchard-sunshine": 1, "city-escape": 1 },
      },
    ],
  },
  {
    id: "q9",
    order: 9,
    question: "如果现在可以买一支香氛产品，你会选？",
    options: [
      {
        id: "q9a",
        label: "日常穿的香水",
        tagScores: { commute: 3, clean: 2, presence: 1 },
        personaScores: { "white-shirt-morning": 1, "cool-black": 1 },
      },
      {
        id: "q9b",
        label: "睡前用的香薰或喷雾",
        tagScores: { sleep: 3, cozy: 2, spiritual: 1 },
        personaScores: { "warm-sweater": 1, "olive-rest": 1 },
      },
      {
        id: "q9c",
        label: "书房/客厅的扩香",
        tagScores: { woody: 2, spiritual: 2, escape: 1, gift: 1 },
        personaScores: { "rain-study": 1 },
      },
      {
        id: "q9d",
        label: "约会出门用的香水",
        tagScores: { date: 3, sweet: 2, bright: 1, presence: 1 },
        personaScores: { "orchard-sunshine": 1 },
      },
    ],
  },
  {
    id: "q10",
    order: 10,
    question: "选一个词形容你当下的人生阶段",
    options: [
      {
        id: "q10a",
        label: "稳定前行",
        tagScores: { commute: 2, clean: 2, mature: 1 },
        personaScores: { "white-shirt-morning": 1, "cool-black": 1 },
      },
      {
        id: "q10b",
        label: "需要安静",
        tagScores: { spiritual: 3, sleep: 2, escape: 1 },
        personaScores: { "olive-rest": 2, "rain-study": 1 },
      },
      {
        id: "q10c",
        label: "想要温暖",
        tagScores: { cozy: 3, soft: 2, sweet: 1 },
        personaScores: { "warm-sweater": 2 },
      },
      {
        id: "q10d",
        label: "想换个活法",
        tagScores: { escape: 3, bright: 2, woody: 1 },
        personaScores: { "city-escape": 2, "orchard-sunshine": 1 },
      },
    ],
  },
];
