/**
 * speakText：learnWord = 有道词典单词音；例句请在页面直接调用 queueLearnExampleQwenSpeech；其余 Web Speech。
 */

import type { SpeakTextOptions } from "./types";
import { haltLearnExamplePlayback } from "./learnExampleSpeak";
import { playYoudaoDictionaryWord, speakWithWebSpeech } from "./webSpeechProvider";

export function speakText(text: string, options?: SpeakTextOptions): boolean {
  const raw = (text ?? "").trim();
  if (!raw) return false;

  /** 例句走千问：`queueLearnExampleQwenSpeech` 由单词页按钮直接 await（见 page.tsx）。 */

  if (options?.scope === "learnWord") {
    haltLearnExamplePlayback();
    return playYoudaoDictionaryWord(raw);
  }

  return speakWithWebSpeech(raw, options);
}
