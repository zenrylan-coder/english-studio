/**
 * V2 单词学习页：浏览器 Web Speech API（不接后端 TTS）。
 * 仅客户端；需在用户点击等手势后调用，利于移动端 Safari / Chrome。
 */

export const V2_SPEECH_GENDERS = ["女声", "男声"] as const;
export type V2SpeechGender = (typeof V2_SPEECH_GENDERS)[number];

const RATE = 0.85;
const LANG = "en-US";

const FEMALE_HINT =
  /\bfemale\b|\bwoman\b|samantha|zira|karen|victoria|susan|veena|ivy|joanna|kimberly|linda|michelle|maria|paulina|fiona|moira|tilly/i;
const MALE_HINT =
  /\bmale\b|\bman\b|fred|david|daniel|mark|thomas|john|james|arthur|cedar|aaron/i;

function isBrowserSpeechSupported(): boolean {
  return typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";
}

function collectVoices(): SpeechSynthesisVoice[] {
  if (!isBrowserSpeechSupported()) return [];
  return window.speechSynthesis.getVoices() ?? [];
}

function englishVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const en = voices.filter((v) => {
    const L = (v.lang ?? "").replace("_", "-").toLowerCase();
    return L.startsWith("en");
  });
  return en.length ? en : voices;
}

function pickVoice(voices: SpeechSynthesisVoice[], gender: V2SpeechGender): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const pool = englishVoices(voices);
  const hints = gender === "女声" ? FEMALE_HINT : MALE_HINT;
  const anti = gender === "女声" ? MALE_HINT : FEMALE_HINT;

  const usFirst = [...pool].sort((a, b) => {
    const au = /^en-us$/i.test((a.lang ?? "").replace("_", "-")) ? 0 : 1;
    const bu = /^en-us$/i.test((b.lang ?? "").replace("_", "-")) ? 0 : 1;
    return au - bu;
  });

  let hit = usFirst.find((v) => hints.test(v.name));
  if (!hit) hit = pool.find((v) => hints.test(v.name));
  if (!hit) hit = usFirst.find((v) => !anti.test(v.name));
  if (!hit) hit = usFirst[0] ?? pool[0] ?? voices[0];
  return hit ?? null;
}

/**
 * 朗读英文文本；会先 cancel 上一轮。
 * @returns 是否已发起 speak（false 表示环境不支持或文本为空）
 */
export function speakV2English(text: string, gender: V2SpeechGender): boolean {
  if (!isBrowserSpeechSupported()) return false;
  const raw = (text ?? "").trim();
  if (!raw) return false;

  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(raw);
  u.lang = LANG;
  u.rate = RATE;
  const voice = pickVoice(collectVoices(), gender);
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
  return true;
}

/** 预热 voices 列表（iOS 等需 voiceschanged 后才完整） */
export function warmUpWebSpeechVoices(): void {
  if (!isBrowserSpeechSupported()) return;
  window.speechSynthesis.getVoices();
}
