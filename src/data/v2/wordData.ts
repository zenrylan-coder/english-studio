export const wordGroups = [
  {
    title: "升学备考组",
    items: [
      { id: "cet4", name: "大学英语四级", total: 4500, learned: 18, current: true, last: "继续：第18词 adapt" },
      { id: "cet6", name: "大学英语六级", total: 5500, learned: 0, current: false, last: "" },
      { id: "kaoyan", name: "考研英语", total: 5500, learned: 12, current: false, last: "" },
      { id: "zsb", name: "专升本英语", total: 3800, learned: 6, current: false, last: "" },
      { id: "ielts", name: "雅思英语", total: 4000, learned: 9, current: false, last: "" },
    ],
  },
  {
    title: "基础学段组",
    items: [
      { id: "high", name: "高中英语", total: 3500, learned: 22, current: false, last: "" },
      { id: "middle", name: "初中英语", total: 1600, learned: 0, current: false, last: "" },
      { id: "primary", name: "小学英语", total: 800, learned: 0, current: false, last: "" },
    ],
  },
];

export const sampleWords = [
  {
    word: "adapt",
    phonetic: "/əˈdæpt/",
    pos: "v.",
    cn: "适应；改编",
    example: "Students need time to adapt to a new learning environment.",
    exampleCn: "学生需要时间适应新的学习环境。",
    review: true,
  },
  {
    word: "adequate",
    phonetic: "/ˈædɪkwət/",
    pos: "adj.",
    cn: "足够的；合格的",
    example: "Adequate preparation can improve your performance in the test.",
    exampleCn: "充分准备可以提升你在考试中的表现。",
    review: true,
  },
  {
    word: "analyze",
    phonetic: "/ˈænəlaɪz/",
    pos: "v.",
    cn: "分析；研究",
    example: "We should analyze the problem before making a decision.",
    exampleCn: "做决定前，我们应该先分析这个问题。",
    review: false,
  },
];

export const personalPackWords = [
  {
    word: "patience",
    phonetic: "/ˈpeɪʃns/",
    pos: "n.",
    cn: "耐心",
    example: "Learning a language requires patience and regular practice.",
    exampleCn: "学习一门语言需要耐心和规律练习。",
    review: false,
  },
  {
    word: "regular",
    phonetic: "/ˈreɡjələr/",
    pos: "adj.",
    cn: "规律的；定期的",
    example: "Regular practice helps students build confidence.",
    exampleCn: "规律练习能帮助学生建立信心。",
    review: false,
  },
  {
    word: "conversation",
    phonetic: "/ˌkɑːnvərˈseɪʃn/",
    pos: "n.",
    cn: "对话；交谈",
    example: "Useful expressions can make real conversations easier.",
    exampleCn: "实用表达能让真实对话更轻松。",
    review: false,
  },
  {
    word: "review",
    phonetic: "/rɪˈvjuː/",
    pos: "v.",
    cn: "复习；回顾",
    example: "Students should review new words after class.",
    exampleCn: "学生应该在课后复习新词。",
    review: false,
  },
  {
    word: "passage",
    phonetic: "/ˈpæsɪdʒ/",
    pos: "n.",
    cn: "段落；文章节选",
    example: "Read short passages to improve your understanding.",
    exampleCn: "阅读短篇段落能提升你的理解能力。",
    review: false,
  },
];

export const personalPackMeta = {
  id: "personal-language-parse",
  name: "语言学习短文解析",
  total: 5,
  learned: 0,
  current: false,
  last: "由文本解析生成",
};

export const accents = ["美音", "英音"];
