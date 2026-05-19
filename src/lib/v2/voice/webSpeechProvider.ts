/**
 * Web Speech API provider + 有道词典 MP3；单词朗读单独走词典发音。
 */

import type { VoiceGender, SpeakTextOptions } from "./types";

type SpeakScope = NonNullable<SpeakTextOptions["scope"]>;

const DEFAULT_LANG = "en-US";
const DEFAULT_RATE = 0.92;
const DEFAULT_PITCH = 1;
const DEFAULT_VOLUME = 1;

/** 有道 dictvoice：`type`、`audio`、`le`；短词词典发音（例句不走此链路）。 */
const YOUDAO_TTS_URL = "https://dict.youdao.com/dictvoice";

const FEMALE_HINT =
  /\bfemale\b|\bwoman\b|samantha|zira|karen|victoria|susan|veena|ivy|joanna|kimberly|linda|michelle|maria|paulina|fiona|moira|tilly/i;
const MALE_HINT =
  /\bmale\b|\bman\b|fred|david|daniel|mark|thomas|john|james|arthur|cedar|aaron/i;

const LEARN_WORD_MALE_HINT =
  /\bmale\b|\bman\b|\bguy\b|fred|david|daniel|mark|thomas|john|james|arthur|cedar|aaron|alex(ander)?|malcolm|oliver|rishi|ryan|gordon|martin|nigel|albert|bruce|charlie|richard|hugh|steve|eddy|victor|klaus|andrew|brian|gavin|christopher|william|cooper|connor|liam|neal|patrick|travis|tyler|eric\b|russell|douglas|craig|cameron|carter|\bjoe\b|google[\s.\-_]*us[\s.\-_]*english[\s.\-_]*male|google[\s.\-_]*uk[\s.\-_]*english[\s.\-_]*male|microsoft[\s.]?(david|mark|george)|\.male\.|premium[\s.\-_]*male|en[\s\-]gb[\s\-].*male|en[\s\-]us[\s\-].*male|\bmale\b.*\bnatural\b|\bnatural\b.*\bmale\b/i;
const NATURAL_VOICE_HINT =
  /natural|neural|google|microsoft|samantha|zira|aria|jenny|guy|davis|libby|sonia|ryan|oliver|daniel|ava|serena|moira/i;

let fallbackAudio: HTMLAudioElement | null = null;

let activeSpeakGeneration = 0;
let cancelDeferredSpeakWait: (() => void) | null = null;

function clearDeferredSpeakWait(): void {
  cancelDeferredSpeakWait?.();
  cancelDeferredSpeakWait = null;
}

/** 任一朗读路径开始前：停有道 MP3、打断 speechSynthesis。 */
export function haltCurrentSpeechOutputs(): void {
  clearDeferredSpeakWait();
  stopFallbackAudio();
  if (typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined") {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* noop */
    }
  }
}

export function speakGenerationMatches(expected: number): boolean {
  return expected === activeSpeakGeneration;
}

export function startSpeakGeneration(): number {
  activeSpeakGeneration += 1;
  clearDeferredSpeakWait();
  return activeSpeakGeneration;
}

function isBrowserSpeechSupported(): boolean {
  return typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";
}

function canUseAudioFallback(): boolean {
  return typeof window !== "undefined" && typeof window.Audio !== "undefined";
}

function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

function collectVoices(): SpeechSynthesisVoice[] {
  if (!isBrowserSpeechSupported()) return [];
  return window.speechSynthesis.getVoices() ?? [];
}

function englishVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const en = voices.filter((v) => {
    const lang = (v.lang ?? "").replace("_", "-").toLowerCase();
    return lang.startsWith("en");
  });
  return en.length ? en : voices;
}

function pickVoice(voices: SpeechSynthesisVoice[], gender: VoiceGender, scope?: SpeakScope): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const pool = englishVoices(voices);
  const maleHints = scope === "learnWord" && gender === "男声" ? LEARN_WORD_MALE_HINT : MALE_HINT;
  const hints = gender === "女声" ? FEMALE_HINT : maleHints;
  const anti = gender === "女声" ? MALE_HINT : FEMALE_HINT;

  const ranked = [...pool].sort((a, b) => {
    const rank = (voice: SpeechSynthesisVoice): number => {
      const lang = (voice.lang ?? "").replace("_", "-");
      const us = /^en-us$/i.test(lang) ? 0 : 1;
      const natural = NATURAL_VOICE_HINT.test(voice.name) ? 0 : 1;
      const local = voice.localService ? 0 : 1;
      return us * 100 + natural * 10 + local;
    };
    return rank(a) - rank(b);
  });

  let hit = ranked.find((v) => NATURAL_VOICE_HINT.test(v.name) && hints.test(v.name));
  if (!hit) hit = ranked.find((v) => hints.test(v.name));
  if (!hit) hit = pool.find((v) => hints.test(v.name));
  if (!hit) hit = ranked.find((v) => NATURAL_VOICE_HINT.test(v.name) && !anti.test(v.name));
  if (!hit) hit = ranked.find((v) => !anti.test(v.name));
  if (!hit) hit = ranked[0] ?? pool[0] ?? voices[0];
  return hit ?? null;
}

function buildYoudaoFallbackUrl(text: string): string {
  return `${YOUDAO_TTS_URL}?audio=${encodeURIComponent(text.trim())}&type=2&le=eng`;
}

export function stopFallbackAudio(): void {
  if (!fallbackAudio) return;
  try {
    fallbackAudio.pause();
    fallbackAudio.currentTime = 0;
  } catch {
    /* noop */
  }
}

function speakWithYoudaoMp3Fallback(text: string, generationExpected: number): boolean {
  if (!canUseAudioFallback()) return false;

  try {
    if (!speakGenerationMatches(generationExpected)) return false;
    stopFallbackAudio();
    fallbackAudio = new Audio(buildYoudaoFallbackUrl(text));
    fallbackAudio.preload = "auto";
    void fallbackAudio.play().catch(() => {
      /* ignore */
    });
    return true;
  } catch {
    return false;
  }
}

/** 单词卡片：有道词典 dictvoice MP3（短词）。 */
export function playYoudaoDictionaryWord(text: string): boolean {
  const raw = text.trim();
  if (!raw || !canUseAudioFallback()) return false;
  haltCurrentSpeechOutputs();
  const generationExpected = startSpeakGeneration();
  try {
    stopFallbackAudio();
    fallbackAudio = new Audio(buildYoudaoFallbackUrl(raw));
    fallbackAudio.preload = "auto";
    void fallbackAudio.play().catch(() => {
      // Some desktop browsers reject cross-origin audio; fall back to Web Speech after the click.
      void runWebSpeechForGeneration(raw, { scope: "learnWord" }, generationExpected);
    });
    return true;
  } catch {
    return false;
  }
}

export function shouldPreferWebSpeechFallbackForTtsApi(): boolean {
  return isLocalDevHost() && !process.env.NEXT_PUBLIC_TCB_API_BASE;
}

function runWebSpeechUtteranceImmediate(text: string, opts: SpeakTextOptions | undefined, generationExpected: number): boolean {
  if (!speakGenerationMatches(generationExpected)) return true;

  const raw = text.trim();
  if (!raw) return false;

  if (!isBrowserSpeechSupported()) {
    return speakWithYoudaoMp3Fallback(raw, generationExpected);
  }

  const gender = opts?.gender ?? "女声";
  const lang = opts?.lang ?? DEFAULT_LANG;
  const rate = typeof opts?.rate === "number" ? opts.rate : DEFAULT_RATE;
  const pitch = typeof opts?.pitch === "number" ? opts.pitch : DEFAULT_PITCH;
  const volume = typeof opts?.volume === "number" ? opts.volume : DEFAULT_VOLUME;
  const scope = opts?.scope;

  try {
    stopFallbackAudio();
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(raw);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    const voice = pickVoice(collectVoices(), gender, scope);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return speakWithYoudaoMp3Fallback(raw, generationExpected);
  }
}

function scheduleWebSpeechWhenVoicesReady(text: string, opts: SpeakTextOptions | undefined, generationExpected: number): boolean {
  const raw = text.trim();
  if (!raw) return false;

  let settled = false;
  let fallbackTimer = 0;

  function finalize(): void {
    if (!speakGenerationMatches(generationExpected)) return;
    if (settled) return;
    settled = true;
    clearDeferredSpeakWait();
    void runWebSpeechUtteranceImmediate(raw, opts, generationExpected);
  }

  function onVoicesChanged(): void {
    if (collectVoices().length === 0) return;
    finalize();
  }

  warmUpWebSpeechVoices();

  window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
  fallbackTimer = window.setTimeout(finalize, 600);
  cancelDeferredSpeakWait = () => {
    window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
    window.clearTimeout(fallbackTimer);
  };

  return true;
}

export function runWebSpeechForGeneration(rawText: string, opts: SpeakTextOptions | undefined, generationExpected: number): boolean {
  const raw = (rawText ?? "").trim();
  if (!raw) return false;

  haltCurrentSpeechOutputs();

  if (!speakGenerationMatches(generationExpected)) return false;

  if (!isBrowserSpeechSupported()) {
    return speakWithYoudaoMp3Fallback(raw, generationExpected);
  }

  try {
    warmUpWebSpeechVoices();

    if (collectVoices().length > 0) {
      return runWebSpeechUtteranceImmediate(raw, opts, generationExpected);
    }

    return scheduleWebSpeechWhenVoicesReady(raw, opts, generationExpected);
  } catch {
    return speakWithYoudaoMp3Fallback(raw, generationExpected);
  }
}

export function speakWithWebSpeech(text: string, options?: SpeakTextOptions): boolean {
  const raw = (text ?? "").trim();
  if (!raw) return false;

  haltCurrentSpeechOutputs();
  const generationExpected = startSpeakGeneration();
  return runWebSpeechForGeneration(raw, options, generationExpected);
}

export function warmUpWebSpeechVoices(): void {
  if (!isBrowserSpeechSupported()) return;
  window.speechSynthesis.getVoices();
}
