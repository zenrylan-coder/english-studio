/** V2 本地持久化（仅浏览器；读取失败时兜底，避免白屏） */

import type { V2WordFavoriteEntry, V2MistakeWordLearningState, V2MistakeEntry, V2MistakesState } from "@/types/v2";

export const V2_STORAGE_KEYS = {
  wordLearning: "english-studio.v2.word-learning",
  /** 收藏词复习进度（与普通词包 word-learning 分离） */
  favoriteWordLearning: "english-studio.v2.favorite-word-learning",
  /** 错题复习进度（与普通词包 word-learning 分离） */
  mistakeWordLearning: "english-studio.v2.mistake-word-learning",
  /** 用户错题记录（无数据时错题库为 0，不注入 demo 错题） */
  mistakes: "english-studio.v2.mistakes",
  favorites: "english-studio.v2.favorites",
  recentLearning: "english-studio.v2.recent-learning",
  uiFlags: "english-studio.v2.ui-flags",
} as const;

const RECENT_MAX = 10;
const SCHEMA_VERSION = 1;

export type V2LearnOrderMode = "sequential" | "shuffle" | "coreFirst";

export type V2WordLearningState = {
  v: number;
  packId: string;
  wordPage: "list" | "learn";
  wordIndex: number;
  reviewOnly: boolean;
  masteredKeys: string[];
  /** 学习页顺序模式；缺省当作正序，兼容旧存档 */
  learnOrderMode?: V2LearnOrderMode;
  /** 乱序用的随机种子，与词条数一并决定排列；缺省时前端会生成 */
  shuffleSeed?: number;
  /** 学习页当前显示的词条（用于首页/续学文案与乱序进度对齐） */
  lastLearnLemma?: string;
};

export type V2FavoritesState = {
  v: number;
  /** 收藏单词（新结构）；旧版 `words: string[]` 仅在读盘时迁移，写盘不再保留 */
  wordFavorites: V2WordFavoriteEntry[];
  /** `writing:${page}:${index}` */
  writing: string[];
  /** `wb:...` */
  workbench: string[];
};

export type { V2WordFavoriteEntry };

export type V2RecentKind = "word" | "writing" | "workbench" | "training";

export type V2RecentItem = {
  id: string;
  kind: V2RecentKind;
  label: string;
  packId?: string;
  wordIndex?: number;
  /** 词条英文，便于首页展示 */
  lemma?: string;
  /** 写作 / 工作台等可选引用 */
  ref?: string;
  trainingTarget?: string;
  at: number;
};

export type V2UiFlags = {
  v: number;
  hasPersonalPack: boolean;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function safeGetJson<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null || raw === "") return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function safeSetJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 配额或其它异常：忽略，避免打断渲染 */
  }
}

export function loadWordLearning(): V2WordLearningState | null {
  const data = safeGetJson<V2WordLearningState>(V2_STORAGE_KEYS.wordLearning);
  if (!data || typeof data.packId !== "string") return null;
  const modeRaw = data.learnOrderMode;
  const learnOrderMode: V2LearnOrderMode | undefined =
    modeRaw === "sequential" || modeRaw === "shuffle" || modeRaw === "coreFirst" ? modeRaw : undefined;
  const shuffleSeed =
    typeof data.shuffleSeed === "number" && Number.isFinite(data.shuffleSeed) && data.shuffleSeed >= 0
      ? Math.floor(data.shuffleSeed)
      : undefined;
  const lastLearnLemma =
    typeof data.lastLearnLemma === "string" && data.lastLearnLemma.trim() ? data.lastLearnLemma.trim() : undefined;
  return {
    v: SCHEMA_VERSION,
    packId: data.packId,
    wordPage: data.wordPage === "learn" || data.wordPage === "list" ? data.wordPage : "list",
    wordIndex: typeof data.wordIndex === "number" && data.wordIndex >= 0 ? data.wordIndex : 0,
    reviewOnly: !!data.reviewOnly,
    masteredKeys: Array.isArray(data.masteredKeys) ? data.masteredKeys.filter((x) => typeof x === "string") : [],
    learnOrderMode,
    shuffleSeed,
    lastLearnLemma,
  };
}

export function saveWordLearning(state: Omit<V2WordLearningState, "v">): void {
  safeSetJson(V2_STORAGE_KEYS.wordLearning, { v: SCHEMA_VERSION, ...state });
}

export type V2FavoriteWordLearningState = {
  v: number;
  mode: "favoriteWords";
  currentIndex: number;
  updatedAt: number;
};

export function loadFavoriteWordLearning(): V2FavoriteWordLearningState | null {
  const data = safeGetJson<Record<string, unknown>>(V2_STORAGE_KEYS.favoriteWordLearning);
  if (!data || typeof data.currentIndex !== "number") return null;
  return {
    v: SCHEMA_VERSION,
    mode: "favoriteWords",
    currentIndex: Math.max(0, data.currentIndex),
    updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : 0,
  };
}

export function saveFavoriteWordLearning(state: Omit<V2FavoriteWordLearningState, "v" | "mode"> & { currentIndex: number; updatedAt: number }): void {
  safeSetJson(V2_STORAGE_KEYS.favoriteWordLearning, {
    v: SCHEMA_VERSION,
    mode: "favoriteWords",
    currentIndex: state.currentIndex,
    updatedAt: state.updatedAt,
  });
}

export type { V2MistakeWordLearningState };

export function loadMistakeWordLearning(): V2MistakeWordLearningState | null {
  const data = safeGetJson<Record<string, unknown>>(V2_STORAGE_KEYS.mistakeWordLearning);
  if (!data || typeof data.currentIndex !== "number") return null;
  return {
    v: SCHEMA_VERSION,
    mode: "mistakeWords",
    currentIndex: Math.max(0, data.currentIndex),
    updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : 0,
  };
}

export function saveMistakeWordLearning(state: Omit<V2MistakeWordLearningState, "v" | "mode"> & { currentIndex: number; updatedAt: number }): void {
  safeSetJson(V2_STORAGE_KEYS.mistakeWordLearning, {
    v: SCHEMA_VERSION,
    mode: "mistakeWords",
    currentIndex: state.currentIndex,
    updatedAt: state.updatedAt,
  });
}

export type { V2MistakeEntry, V2MistakesState };

function normalizeMistakeEntry(raw: unknown): V2MistakeEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const word = typeof o.word === "string" ? o.word.trim() : "";
  if (!word) return null;
  const wordId = typeof o.wordId === "string" && o.wordId.trim() ? o.wordId.trim().toLowerCase() : word.toLowerCase();
  return {
    wordId,
    word,
    category: typeof o.category === "string" ? o.category : "",
    reason: typeof o.reason === "string" ? o.reason : "",
    action: typeof o.action === "string" ? o.action : "",
    packs: Array.isArray(o.packs) ? (o.packs.filter((x) => typeof x === "string") as string[]) : [],
    addedAt: typeof o.addedAt === "number" && o.addedAt > 0 ? o.addedAt : 0,
  };
}

export function defaultMistakes(): V2MistakesState {
  return { v: SCHEMA_VERSION, items: [] };
}

/** 读取本地错题；没有数据时返回空（不注入 demo 错题） */
export function loadMistakes(): V2MistakesState {
  const data = safeGetJson<Record<string, unknown>>(V2_STORAGE_KEYS.mistakes);
  if (!data || !Array.isArray(data.items)) return defaultMistakes();
  const items = data.items.map(normalizeMistakeEntry).filter(Boolean) as V2MistakeEntry[];
  return { v: SCHEMA_VERSION, items };
}

export function saveMistakes(state: V2MistakesState): void {
  safeSetJson(V2_STORAGE_KEYS.mistakes, {
    v: SCHEMA_VERSION,
    items: state.items,
  });
}

export function makeWordId(lemma: string): string {
  return lemma.trim().toLowerCase();
}

function normalizeWordFavoriteEntry(raw: unknown): V2WordFavoriteEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const wordId = typeof o.wordId === "string" ? o.wordId : typeof o.word === "string" ? makeWordId(o.word) : null;
  const word = typeof o.word === "string" ? o.word : wordId ?? "";
  if (!wordId || !word) return null;
  return {
    wordId: wordId.toLowerCase(),
    word,
    savedFromGroupId: typeof o.savedFromGroupId === "string" ? o.savedFromGroupId : "",
    savedFromGroupName: typeof o.savedFromGroupName === "string" ? o.savedFromGroupName : "",
    savedFromPackId: typeof o.savedFromPackId === "string" ? o.savedFromPackId : "",
    savedFromPackName: typeof o.savedFromPackName === "string" ? o.savedFromPackName : "",
    savedAt: typeof o.savedAt === "number" && o.savedAt > 0 ? o.savedAt : 0,
  };
}

function legacyWordStringsToEntries(strings: string[]): V2WordFavoriteEntry[] {
  const out: V2WordFavoriteEntry[] = [];
  for (const s of strings) {
    if (typeof s !== "string") continue;
    const p = parseWordFavoriteKey(s);
    if (!p) continue;
    out.push({
      wordId: p.lemma,
      word: p.lemma,
      savedFromGroupId: "",
      savedFromGroupName: "",
      savedFromPackId: p.packId,
      savedFromPackName: "",
      savedAt: 0,
    });
  }
  return out;
}

export function defaultFavorites(): V2FavoritesState {
  return { v: SCHEMA_VERSION, wordFavorites: [], writing: [], workbench: [] };
}

export function loadFavorites(): V2FavoritesState {
  const data = safeGetJson<Record<string, unknown>>(V2_STORAGE_KEYS.favorites);
  if (!data) return defaultFavorites();

  let wordFavorites: V2WordFavoriteEntry[] = [];
  if (Array.isArray(data.wordFavorites)) {
    wordFavorites = data.wordFavorites.map(normalizeWordFavoriteEntry).filter(Boolean) as V2WordFavoriteEntry[];
  }

  if (wordFavorites.length === 0 && Array.isArray(data.words)) {
    const maybeLegacy = data.words.filter((x) => typeof x === "string") as string[];
    if (maybeLegacy.length > 0) {
      wordFavorites = legacyWordStringsToEntries(maybeLegacy);
    }
  }

  return {
    v: SCHEMA_VERSION,
    wordFavorites,
    writing: Array.isArray(data.writing) ? data.writing.filter((x) => typeof x === "string") : [],
    workbench: Array.isArray(data.workbench) ? data.workbench.filter((x) => typeof x === "string") : [],
  };
}

export function saveFavorites(state: V2FavoritesState): void {
  safeSetJson(V2_STORAGE_KEYS.favorites, {
    v: SCHEMA_VERSION,
    wordFavorites: state.wordFavorites,
    writing: state.writing,
    workbench: state.workbench,
  });
}

export function loadRecentLearning(): V2RecentItem[] {
  const data = safeGetJson<V2RecentItem[]>(V2_STORAGE_KEYS.recentLearning);
  if (!Array.isArray(data)) return [];
  return data
    .filter((x) => x && typeof x.id === "string" && typeof x.kind === "string" && typeof x.label === "string")
    .slice(0, RECENT_MAX);
}

export function saveRecentLearning(items: V2RecentItem[]): void {
  safeSetJson(V2_STORAGE_KEYS.recentLearning, items.slice(0, RECENT_MAX));
}

/** 去重按 id，新记录在前，最多 10 条 */
export function pushRecentLearning(item: Omit<V2RecentItem, "at">): V2RecentItem[] {
  const prev = loadRecentLearning();
  const next: V2RecentItem[] = [{ ...item, at: Date.now() }, ...prev.filter((x) => x.id !== item.id)].slice(0, RECENT_MAX);
  saveRecentLearning(next);
  return next;
}

export function loadUiFlags(): V2UiFlags {
  const data = safeGetJson<V2UiFlags>(V2_STORAGE_KEYS.uiFlags);
  if (!data || typeof data.hasPersonalPack !== "boolean") {
    return { v: SCHEMA_VERSION, hasPersonalPack: false };
  }
  return { v: SCHEMA_VERSION, hasPersonalPack: data.hasPersonalPack };
}

export function saveUiFlags(flags: V2UiFlags): void {
  safeSetJson(V2_STORAGE_KEYS.uiFlags, { ...flags, v: SCHEMA_VERSION });
}

export function makeWordKey(packId: string, lemma: string): string {
  return `${packId}:${lemma.trim().toLowerCase()}`;
}

export function makeWritingFavoriteId(writingPage: string, index: number): string {
  return `writing:${writingPage}:${index}`;
}

/** 工作台一条表达/句子的收藏 id，例如 wb:scene:expr:0 */
export function makeWorkbenchFavoriteId(scope: string, kind: string, index: number): string {
  return `wb:${scope}:${kind}:${index}`;
}

/** 解析 `packId:lemma`（lemma 不含冒号时可靠） */
export function parseWordFavoriteKey(id: string): { packId: string; lemma: string } | null {
  if (!id || typeof id !== "string") return null;
  const i = id.indexOf(":");
  if (i <= 0 || i === id.length - 1) return null;
  const packId = id.slice(0, i);
  const lemma = id.slice(i + 1);
  if (!packId || !lemma) return null;
  return { packId, lemma: lemma.trim().toLowerCase() };
}

/** 解析 `writing:${写作页名}:${index}` */
export function parseWritingFavoriteId(id: string): { page: string; index: number } | null {
  if (!id || typeof id !== "string") return null;
  const m = id.match(/^writing:(.+):(\d+)$/);
  if (!m) return null;
  const index = parseInt(m[2], 10);
  if (!Number.isFinite(index) || index < 0) return null;
  return { page: m[1], index };
}

/** 解析 `wb:${scope}:${kind}:${index}`（与 makeWorkbenchFavoriteId 一致） */
export function parseWorkbenchFavoriteId(id: string): { scope: string; kind: string; index: number } | null {
  if (!id || typeof id !== "string") return null;
  const m = id.match(/^wb:([^:]+):([^:]+):(\d+)$/);
  if (!m) return null;
  const index = parseInt(m[3], 10);
  if (!Number.isFinite(index) || index < 0) return null;
  return { scope: m[1], kind: m[2], index };
}
