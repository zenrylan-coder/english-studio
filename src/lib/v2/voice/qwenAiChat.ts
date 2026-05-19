import { speakText } from "./speakText";
import type { VoiceGender } from "./types";
import { shouldPreferWebSpeechFallbackForTtsApi } from "./webSpeechProvider";

type QwenTtsResult = {
  ok?: boolean;
  url?: string;
  mimeType?: string;
  audioBase64?: string;
  voice?: string;
  error?: string;
};

const API_PATH_SUFFIX = "/api/qwen-ai-tts";
const audioCache = new Map<string, { url?: string; mimeType?: string; audioBase64?: string }>();
let currentAudio: HTMLAudioElement | null = null;
let currentBlobUrl: string | null = null;
const RETRY_DELAYS = [0, 250];

/**
 * CloudBase static hosting (xxx.tcloudbaseapp.com) and the HTTP Access
 * Service (xxx.<region>.app.tcloudbase.com) live on different domains,
 * so static pages must call the access-service host directly.
 * Build-time override: NEXT_PUBLIC_TCB_API_BASE.
 */
function resolveApiUrl(): string {
  const override = process.env.NEXT_PUBLIC_TCB_API_BASE;
  if (override) {
    return override.replace(/\/+$/, "") + API_PATH_SUFFIX;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.endsWith(".tcloudbaseapp.com")) {
      const apiHost = host.replace(/\.tcloudbaseapp\.com$/, ".ap-shanghai.app.tcloudbase.com");
      return `${window.location.protocol}//${apiHost}${API_PATH_SUFFIX}`;
    }
  }
  return API_PATH_SUFFIX;
}

function normalizeChatGender(value: string): VoiceGender {
  const s = String(value ?? "").trim();
  if (s === "男声" || s === "男" || /^male$/i.test(s)) return "男声";
  return "女声";
}

function qwenTtsVoiceName(gender: VoiceGender): "Cherry" | "Ethan" {
  return gender === "男声" ? "Ethan" : "Cherry";
}

function makeCacheKey(text: string, gender: VoiceGender): string {
  return `${gender}::${text.trim()}`;
}

function stopCurrentAudio() {
  if (!currentAudio) return;
  try {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  } catch {
    // ignore
  }
  if (currentBlobUrl) {
    try {
      URL.revokeObjectURL(currentBlobUrl);
    } catch {
      // ignore
    }
    currentBlobUrl = null;
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mimeType || "audio/mpeg" });
}

async function getAudioPayload(text: string, gender: VoiceGender): Promise<{ url?: string; mimeType?: string; audioBase64?: string }> {
  const key = makeCacheKey(text, gender);
  const cached = audioCache.get(key);
  if (cached) return cached;

  const voice = qwenTtsVoiceName(gender);
  const res = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, gender, voice }),
  });

  if (!res.ok) {
    throw new Error(`Qwen TTS request failed: ${res.status}`);
  }

  const data = (await res.json()) as QwenTtsResult;
  if (!data?.url && !data?.audioBase64) {
    throw new Error(data?.error || "Qwen TTS returned no audio URL");
  }

  const payload = {
    url: data.url,
    mimeType: data.mimeType,
    audioBase64: data.audioBase64,
  };
  audioCache.set(key, payload);
  return payload;
}

function clearAudioCache(text: string, gender: VoiceGender) {
  audioCache.delete(makeCacheKey(text, gender));
}

async function playAudioPayload(payload: { url?: string; mimeType?: string; audioBase64?: string }): Promise<void> {
  stopCurrentAudio();
  let src = payload.url || "";
  if (payload.audioBase64) {
    const blob = base64ToBlob(payload.audioBase64, payload.mimeType || "audio/mpeg");
    currentBlobUrl = URL.createObjectURL(blob);
    src = currentBlobUrl;
  }
  if (!src) {
    throw new Error("No playable audio source");
  }
  currentAudio = new Audio(src);
  currentAudio.setAttribute("playsinline", "");
  currentAudio.setAttribute("webkit-playsinline", "");
  currentAudio.preload = "auto";
  await currentAudio.play();
}

export async function playQwenAiChat(text: string, gender: VoiceGender): Promise<boolean> {
  const raw = (text || "").trim();
  if (!raw) return false;

  const g = normalizeChatGender(gender);
  if (shouldPreferWebSpeechFallbackForTtsApi()) {
    return speakText(raw, { gender: g, lang: "en-US", rate: 0.93, pitch: 1, volume: 1 });
  }
  for (const delay of RETRY_DELAYS) {
    try {
      if (delay > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, delay));
        clearAudioCache(raw, g);
      }
      const payload = await getAudioPayload(raw, g);
      await playAudioPayload(payload);
      return true;
    } catch {
      // retry
    }
  }

  return speakText(raw, { gender: g });
}
