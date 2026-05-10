import type { TodayTask } from "@/types/v2";

export const todayTasks = [
  {
    title: "复习词表待巩固项",
    desc: "四级/专升本基础词 · 预计 6 分钟",
    target: "words",
    done: true,
  },
  {
    title: "跟读 12 条校园与求职场景句",
    desc: "口语跟读 · 预计 4 分钟",
    target: "shadow",
    done: false,
  },
  {
    title: "完成 1 轮 AI 语音对话",
    desc: "校园学习场景 · 预计 5 分钟",
    target: "aiVoice",
    done: false,
  },
] satisfies TodayTask[];
