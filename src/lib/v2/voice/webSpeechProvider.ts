/**
 * Web Speech API 实现（仅在本目录内使用；page 不直接碰 speechSynthesis）。
 */

import type { VoiceGender, SpeakTextOptions } from "./types";

const DEFAULT_LANG = "en-US";
const DEFAULT_RATE = 0.85;

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

function pickVoice(voices: SpeechSynthesisVoice[], gender: VoiceGender): SpeechSynthesisVoice | null {
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

export function speakWithWebSpeech(text: string, options?: SpeakTextOptions): boolean {
  if (!isBrowserSpeechSupported()) return false;
  const raw = (text ?? "").trim();
  if (!raw) return false;

  const gender = options?.gender ?? "女声";
  const lang = options?.lang ?? DEFAULT_LANG;
  const rate = typeof options?.rate === "number" ? options.rate : DEFAULT_RATE;

  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(raw);
  u.lang = lang;
  u.rate = rate;
  const voice = pickVoice(collectVoices(), gender);
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
  return true;
}

export function warmUpWebSpeechVoices(): void {
  if (!isBrowserSpeechSupported()) return;
  window.speechSynthesis.getVoices();
}
