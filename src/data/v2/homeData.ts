import type { TodayTask } from "@/types/v2";

export const todayTasks = [
  { title: "复习 8 个待复习词", desc: "四级核心词 · 预计 6 分钟", target: "words", done: true },
  { title: "跟读 5 句高频短句", desc: "口语跟读训练 · 预计 4 分钟", target: "shadow", done: false },
  { title: "完成 1 轮 AI 语音对话", desc: "生活出行场景 · 预计 5 分钟", target: "aiVoice", done: false },
] satisfies TodayTask[];
