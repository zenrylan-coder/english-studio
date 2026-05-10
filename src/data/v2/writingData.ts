import type { WritingMap, WritingStage, WritingType } from "@/types/v2";

export const writingTypes = ["万能框架", "高分句型", "话题素材", "原创范文拆解"] as const satisfies readonly WritingType[];
export const writingStages = ["四级", "六级", "考研", "专升本", "雅思"] as const satisfies readonly WritingStage[];

export const writingMap = {
  万能框架: {
    desc: "按段落功能搭骨架，写作用来提示位置而非背固定句。",
    items: [
      ["开篇点题", "Nowadays, ... has become a hot topic among college students.", "先交代现象，再逐步收窄到你熟悉的校园/学习角度。"],
      ["表明立场", "Personally, I believe that ... because it affects our daily study.", "专升本与四级基础作文都适合把观点说具体一点。"],
      ["分层展开", "First, ... Second, ... Finally, ...", "三条理由别写成同义反复，每条对应一个清晰角度。"],
      ["举例支撑", "For example, when I prepare for exams, I often ...", "例子用第一人称更自然，但避免流水账。"],
      ["让步转折", "Admittedly, ...; however, ...", "先承认对立面，再用 however 拉回你的主论点。"],
      ["简短结尾", "In short, we should take action instead of delaying our plan.", "结尾不必长，回扣主题并给出一个可执行的态度即可。"],
    ],
  },
  高分句型: {
    desc: "换一组更可迁移的表达，用在观点、原因、举例、总结与建议（自学整理）。",
    items: [
      ["观点", "I think the problem is serious.", "In my view, this issue is worth serious attention."],
      ["原因", "Because many students feel anxious.", "This is largely because many students struggle with anxiety."],
      ["举例", "For example, I study every night.", "A concrete example is that I set aside thirty minutes each night for revision."],
      ["对比", "Studying alone is bad.", "Compared with studying alone, pair practice often keeps me more accountable."],
      ["总结", "So we must try harder.", "To sum up, consistent effort matters more than occasional bursts of cramming."],
      ["建议", "We should ask teachers.", "It would be helpful to ask tutors for feedback on our writing drafts."],
      ["重要性", "English is important.", "Proficiency in English plays a key role in accessing more learning resources."],
      ["趋势", "More students use apps.", "An increasing number of students rely on mobile apps for spaced repetition."],
      ["影响", "It affects our grades.", "This habit has a direct impact on both accuracy and confidence."],
      ["行动", "We need to practice.", "Therefore, scheduling regular speaking drills is a practical next step."],
    ],
  },
  话题素材: {
    desc: "校园与考试相关语块，写时可按主题替换主语。",
    items: [
      ["学习", "time management", "安排刷题与口语；适合周计划类作文。"],
      ["考试", "deal with exam pressure", "缓解焦虑；适合心理健康与学习平衡话题。"],
      ["升学", "upgrade exam preparation", "升本复习节奏；注意用自己的经历改写。"],
      ["小组", "collaborative learning", "合作学习；适合讨论线上/线下学习方式。"],
      ["自律", "self-discipline", "自律与拖延；适合举例说明如何坚持打卡。"],
      ["实习", "internship experience", "实习收获；适合就业准备短文。"],
    ],
  },
  原创范文拆解: {
    desc: "把段落任务拆成可执行的检查项，而不是背诵整篇范文。",
    items: [
      ["首段", "背景一句 + 观点一句", "让读者知道话题与立场各是什么。"],
      ["主体", "两条理由 + 各带半句例子", "例子点到为止，服务论证即可。"],
      ["连接", "Therefore / However / For instance", "检查衔接词是否真正表达转折或因果。"],
      ["语气", "避免绝对化夸张", "少用 always/never，除非确有把握。"],
      ["收尾", "重申观点 + 一句建议", "与首段呼应，不必突然引入新概念。"],
      ["自查", "人称与时态一致", "议论文常用一般现在时，例子里有过去事件要统一时态。"],
    ],
  },
} satisfies WritingMap;
