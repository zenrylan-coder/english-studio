import type { ParsedWordTuple, SceneScriptLine } from "@/types/v2";

export const sceneScript = [
  ["室友", "Do you want to review the upgrade exam vocabulary list tonight?"],
  ["你", "Yes. Can we use the quiet zone on the second floor?"],
  ["室友", "Sure. I also want to practice answering interview questions out loud."],
  ["你", "Great. Let's do ten minutes of shadowing after we finish the list."],
  ["室友", "Sounds good. I will bring my notebook for new collocations."],
] satisfies SceneScriptLine[];

export const shadowLines = [
  "I'm preparing for the upgrade exam this semester.",
  "Could we go over the word list after today's lecture?",
  "I need more speaking practice before the mock interview.",
  "I would like to introduce myself in one minute.",
  "Joining a study group helped me stay on track.",
] satisfies string[];

export const usefulExpressions = [
  "prepare for the upgrade exam",
  "review new words after class",
  "in short conversations with classmates",
  "speaking practice before the interview",
  "join a study group",
] satisfies string[];

export const parsedWords = [
  ["prepare", "v. 准备"],
  ["upgrade", "n. 升级；此处指升本考试语境下的提升"],
  ["review", "v. 复习"],
  ["conversation", "n. 对话；交谈"],
  ["practice", "n./v. 练习"],
] satisfies ParsedWordTuple[];

export const parsedPhrases = [
  "prepare for",
  "review new words",
  "after class",
  "study group",
] satisfies string[];

export const parsedSentences = [
  "I'm Li Hua, a third-year student preparing for the upgrade exam.",
  "I usually review new words in the library after class and try to use them in short conversations with classmates.",
] satisfies string[];
