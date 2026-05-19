import type { VoiceGender } from "./types";
import { haltCurrentSpeechOutputs, shouldPreferWebSpeechFallbackForTtsApi } from "./webSpeechProvider";

const API_PATH_SUFFIX = "/api/qwen-ai-tts";

let learnExampleHtmlAudio: HTMLAudioElement | null = null;
let learnExampleBlobUrl: string | null = null;

let learnExampleWaCtx: AudioContext | null = null;
let learnExampleWaSource: AudioBufferSourceNode | null = null;

const RETRY_DELAYS_MS = [0, 450, 900];

/** 例句 MP3 前端内存缓存（不落盘）；命中则跳过 qwen-ai-tts + 远程拉取 */
const EXAMPLE_MP3_CACHE = new Map<string, ArrayBuffer>();
const EXAMPLE_MP3_CACHE_MAX = 48;

/** 缓存 key：`${女声|男声}\u001f${trimmedExample}`（US 分隔符降低与正文冲突概率） */
function exampleAudioCacheKey(gender: VoiceGender, trimmedExample: string): string {
  return `${gender}\u001f${trimmedExample}`;
}

function rememberExampleMp3(cacheKey: string, bytes: ArrayBuffer): void {
  if (EXAMPLE_MP3_CACHE.size >= EXAMPLE_MP3_CACHE_MAX) {
    const oldest = EXAMPLE_MP3_CACHE.keys().next().value as string | undefined;
    if (oldest !== undefined) EXAMPLE_MP3_CACHE.delete(oldest);
  }
  EXAMPLE_MP3_CACHE.set(cacheKey, bytes.slice(0));
}

/** 最近一次例句朗读是否成功；失败带 step / message（含 DOM play reject 文案） */
export type QueueLearnExampleResult =
  | { ok: true }
  | { ok: false; step: string; message: string; name?: string };

/** 例句播放 UI：首帧出声前 / 播完或终止后 */
export type LearnExamplePlaybackHooks = {
  onPlaybackStarted?: () => void;
  onPlaybackEnded?: () => void;
};

type QwenTtsResult = {
  ok?: boolean;
  url?: string;
  error?: string;
  message?: string;
};

function revokeLearnExampleBlobUrl(): void {
  if (!learnExampleBlobUrl) return;
  try {
    URL.revokeObjectURL(learnExampleBlobUrl);
  } catch {
    /* noop */
  }
  learnExampleBlobUrl = null;
}

function stopLearnExampleWebAudio(): void {
  try {
    learnExampleWaSource?.stop();
  } catch {
    /* noop */
  }
  learnExampleWaSource = null;
}

/** 只拆掉 HTML Audio，不误伤 blob:/object URL（避免播前 revoke） */
function detachLearnExampleHtmlAudio(): void {
  if (!learnExampleHtmlAudio) return;
  try {
    learnExampleHtmlAudio.pause();
    learnExampleHtmlAudio.currentTime = 0;
    learnExampleHtmlAudio.removeAttribute("src");
    learnExampleHtmlAudio.load();
    learnExampleHtmlAudio.parentNode?.removeChild(learnExampleHtmlAudio);
  } catch {
    /* noop */
  }
  learnExampleHtmlAudio = null;
}

export function haltLearnExamplePlayback(): void {
  stopLearnExampleWebAudio();
  detachLearnExampleHtmlAudio();
  revokeLearnExampleBlobUrl();
}

function resolveQwenTtsUrl(): string {
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

function voiceForGender(gender: VoiceGender): "Cherry" | "Ethan" {
  return gender === "男声" ? "Ethan" : "Cherry";
}

async function decodeTtsPayload(res: Response): Promise<{ url?: string; error?: string; message?: string }> {
  const rawText = await res.text();
  if (!rawText || !rawText.trim()) return { error: "Empty response body" };
  try {
    return JSON.parse(rawText) as QwenTtsResult;
  } catch {
    return { error: rawText.slice(0, 120) };
  }
}

function pingLearnExampleAudioContext(): AudioContext | null {
  try {
    const AC =
      typeof window !== "undefined"
        ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!AC) return null;
    if (!learnExampleWaCtx || learnExampleWaCtx.state === "closed") learnExampleWaCtx = new AC();
    void learnExampleWaCtx.resume().catch(() => {
      /* 后续 decode 前会再 resume */
    });
    return learnExampleWaCtx;
  } catch {
    return null;
  }
}

function errShape(e: unknown): { message: string; name?: string } {
  if (e && typeof e === "object") {
    const o = e as { name?: string; message?: string };
    const m = typeof o.message === "string" ? o.message : JSON.stringify(o);
    return { message: m, name: typeof o.name === "string" ? o.name : undefined };
  }
  return { message: String(e ?? "unknown") };
}

function playExampleWithWebSpeechFallback(
  text: string,
  hooks?: LearnExamplePlaybackHooks,
): QueueLearnExampleResult {
  if (typeof window === "undefined" || typeof window.speechSynthesis === "undefined") {
    return { ok: false, step: "web-speech", message: "Web Speech unavailable" };
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.88;
    utterance.onstart = () => hooks?.onPlaybackStarted?.();
    utterance.onend = () => hooks?.onPlaybackEnded?.();
    utterance.onerror = () => hooks?.onPlaybackEnded?.();
    window.speechSynthesis.speak(utterance);
    return { ok: true };
  } catch (e) {
    const err = errShape(e);
    return { ok: false, step: "web-speech", message: err.message, name: err.name };
  }
}

/**
 * DOM 挂载的 <audio>.play()；失败会得到常见 NotAllowedError / NotSupportedError。
 */
async function tryPlayDomAttachedAudio(
  blobUrl: string,
  hooks?: LearnExamplePlaybackHooks,
): Promise<{ message: string; name?: string } | null> {
  detachLearnExampleHtmlAudio();

  const audio = document.createElement("audio");
  audio.hidden = true;
  audio.style.display = "none";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");
  audio.preload = "auto";
  try {
    audio.volume = 1;
  } catch {
    /* noop */
  }

  document.body.appendChild(audio);
  learnExampleHtmlAudio = audio;
  audio.src = blobUrl;
  audio.load();

  try {
    await audio.play();
    hooks?.onPlaybackStarted?.();
    let done = false;
    const finish = (): void => {
      if (done) return;
      done = true;
      hooks?.onPlaybackEnded?.();
    };
    audio.addEventListener("ended", finish, { once: true });
    audio.addEventListener("error", finish, { once: true });
    return null;
  } catch (e) {
    return errShape(e);
  }
}

async function tryPlayWebAudio(
  arrayBuffer: ArrayBuffer,
  hooks?: LearnExamplePlaybackHooks,
): Promise<{ message: string; name?: string } | null> {
  stopLearnExampleWebAudio();
  detachLearnExampleHtmlAudio();
  const ctx = pingLearnExampleAudioContext();
  if (!ctx) return { message: "Web Audio unavailable" };

  try {
    await ctx.resume().catch(() => undefined);
    let decoded: AudioBuffer;
    try {
      decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    } catch (e: unknown) {
      return errShape(e);
    }

    const src = ctx.createBufferSource();
    src.buffer = decoded;
    src.connect(ctx.destination);
    learnExampleWaSource = src;
    src.start(0);
    hooks?.onPlaybackStarted?.();

    const ms = Math.min(120_000, decoded.duration * 1000 + 1000);

    await Promise.race([
      new Promise<void>((resolve) => {
        src.onended = (): void => resolve();
      }),
      new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), ms);
      }),
    ]);

    hooks?.onPlaybackEnded?.();
    learnExampleWaSource = null;
    return null;
  } catch (e: unknown) {
    learnExampleWaSource = null;
    return errShape(e);
  }
}

async function playMp3Bytes(
  bytes: ArrayBuffer,
  blobForUrl: Blob,
  hooks?: LearnExamplePlaybackHooks,
): Promise<QueueLearnExampleResult> {
  revokeLearnExampleBlobUrl();
  stopLearnExampleWebAudio();
  detachLearnExampleHtmlAudio();

  const blobUrl = URL.createObjectURL(blobForUrl);
  learnExampleBlobUrl = blobUrl;

  const domErr = await tryPlayDomAttachedAudio(blobUrl, hooks);
  if (!domErr) return { ok: true };

  const waErr = await tryPlayWebAudio(bytes, hooks);
  if (!waErr) return { ok: true };

  return {
    ok: false,
    step: "audio-playback",
    name: domErr.name && waErr.name ? `${domErr.name};${waErr.name}` : domErr.name ?? waErr.name,
    message: `DOM.audio.play: ${domErr.message} | WebAudio: ${waErr.message}`,
  };
}

export async function queueLearnExampleQwenSpeech(
  text: string,
  gender: VoiceGender,
  hooks?: LearnExamplePlaybackHooks,
): Promise<QueueLearnExampleResult> {
  const raw = text.trim();
  if (!raw || typeof window === "undefined") {
    return { ok: false, step: "input", message: "empty text or SSR" };
  }

  pingLearnExampleAudioContext();

  haltCurrentSpeechOutputs();
  haltLearnExamplePlayback();

  const g: VoiceGender = gender === "男声" ? "男声" : "女声";
  const voice = voiceForGender(g);
  const key = exampleAudioCacheKey(g, raw);

  if (shouldPreferWebSpeechFallbackForTtsApi()) {
    return playExampleWithWebSpeechFallback(raw, hooks);
  }

  const cached = EXAMPLE_MP3_CACHE.get(key);
  if (cached && cached.byteLength >= 16) {
    const blob = new Blob([cached], { type: "audio/mpeg" });
    const replay = await playMp3Bytes(cached, blob, hooks);
    if (replay.ok === true) return { ok: true };
    EXAMPLE_MP3_CACHE.delete(key);
  }

  let lastFail: QueueLearnExampleResult = { ok: false, step: "unknown", message: "exhausted" };

  for (let ri = 0; ri < RETRY_DELAYS_MS.length; ri++) {
    const delay = RETRY_DELAYS_MS[ri];
    if (delay > 0) await new Promise((r) => window.setTimeout(r, delay));

    pingLearnExampleAudioContext();

    try {
      const res = await fetch(resolveQwenTtsUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: raw, gender: g, voice }),
      });

      const data = await decodeTtsPayload(res);
      const url = typeof data.url === "string" ? data.url.trim() : "";

      if (!res.ok || !url) {
        lastFail = {
          ok: false,
          step: "qwen-ai-tts-json",
          message: data.error || data.message || `HTTP ${res.status}`,
        };
        haltLearnExamplePlayback();
        continue;
      }

      const soundRes = await fetch(url, { mode: "cors", credentials: "omit", cache: "no-store" });
      if (!soundRes.ok) {
        lastFail = { ok: false, step: "mp3-http", message: String(soundRes.status) };
        haltLearnExamplePlayback();
        continue;
      }

      const ab = await soundRes.arrayBuffer();
      if (ab.byteLength < 16) {
        lastFail = { ok: false, step: "mp3-empty", message: `${ab.byteLength} bytes` };
        haltLearnExamplePlayback();
        continue;
      }

      const blob = new Blob([ab], { type: soundRes.headers.get("content-type") || "audio/mpeg" });
      lastFail = await playMp3Bytes(ab, blob, hooks);
      if (lastFail.ok === true) {
        rememberExampleMp3(key, ab);
        return { ok: true };
      }

      haltLearnExamplePlayback();
    } catch {
      haltLearnExamplePlayback();
    }
  }

  const fallback = playExampleWithWebSpeechFallback(raw, hooks);
  return fallback.ok ? fallback : lastFail;
}
