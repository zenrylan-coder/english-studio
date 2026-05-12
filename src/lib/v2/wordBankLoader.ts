/**
 * V2 真实词库加载器
 *
 * 从 public/data/v2/word-banks/ 加载静态 JSON 分包
 * 带简单内存缓存，避免重复 fetch
 * 加载失败返回错误状态，不让页面崩溃
 */

export type WordBankEntry = {
  wordId: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  exampleCn: string;
  belongsTo: string[];
  sourceNotes: string;
  phoneticMissing: boolean;
};

export type WordBankManifest = Record<
  string,
  {
    count: number;
    withPhonetic: number;
    withoutPhonetic: number;
    phoneticRate: string;
  }
>;

type LoadState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; data: T }
  | { status: "error"; error: string };

/** 词包 id 到显示名称的映射 */
export const BANK_LABELS: Record<string, string> = {
  cet4: "大学英语四级",
  cet6: "大学英语六级",
  kaoyan: "考研英语",
  zhuanshengben: "专升本英语",
  ielts: "雅思英语",
};

/** 显示名称到词包 id 的反查 */
export const LABEL_TO_BANK_ID: Record<string, string> = {
  "大学英语四级": "cet4",
  "大学英语六级": "cet6",
  "考研英语": "kaoyan",
  "专升本英语": "zhuanshengben",
  "雅思英语": "ielts",
};

// 内存缓存
let manifestCache: WordBankManifest | null = null;
const bankCache = new Map<string, WordBankEntry[]>();

// 63 条解析错误的单词映射（word "a art." → word "a"）
// 这些是 CET4 源文件中 `word pos. definition` 格式导致的解析错误
const WORD_FIX_MAP = new Map<string, string>([
  ["a art.", "a"],
  ["case n.", "case"],
  ["china n.", "china"],
  ["even a.", "even"],
  ["fan n.", "fan"],
  ["flat n.", "flat"],
  ["i pron.", "i"],
  ["jam vt.", "jam"],
  ["lie vi.", "lie"],
  ["like prep.", "like"],
  ["living-room n.", "living-room"],
  ["long vi.", "long"],
  ["march vi.", "march"],
  ["match n.", "match"],
  ["mean a.", "mean"],
  ["mercury n.", "mercury"],
  ["minute a.", "minute"],
  ["miss vt.", "miss"],
  ["p.m. n.", "p.m."],
  ["pick vt.", "pick"],
  ["pole n.", "pole"],
  ["pool n.", "pool"],
  ["pop n.", "pop"],
  ["post n.", "post"],
  ["pound vt.", "pound"],
  ["present n.", "present"],
  ["present vt.", "present"],
  ["punch vt.", "punch"],
  ["pupil n.", "pupil"],
  ["race n.", "race"],
  ["rack vt.", "rack"],
  ["rear vt.", "rear"],
  ["rest n.", "rest"],
  ["ring vi.", "ring"],
  ["rock n.", "rock"],
  ["row vt.", "row"],
  ["scale n.", "scale"],
  ["seal n.", "seal"],
  ["second n.", "second"],
  ["secondly ad.", "secondly"],
  ["shed n.", "shed"],
  ["so-called a.", "so-called"],
  ["sound n.", "sound"],
  ["spring n.", "spring"],
  ["stable n.", "stable"],
  ["state vt.", "state"],
  ["stroke vt.", "stroke"],
  ["surprisingly ad.", "surprisingly"],
  ["swallow vt.", "swallow"],
  ["tap n.", "tap"],
  ["tear vt.", "tear"],
  ["tend vi.", "tend"],
  ["tense a.", "tense"],
  ["tip vt.", "tip"],
  ["toast n.", "toast"],
  ["used a.", "used"],
  ["utter vt.", "utter"],
  ["vice n.", "vice"],
  ["wage vt.", "wage"],
  ["well ad.", "well"],
  ["well-known a.", "well-known"],
  ["wind vt.", "wind"],
  ["yard n.", "yard"],
]);

function fixWord(entry: WordBankEntry): WordBankEntry {
  const lowerWord = entry.word.toLowerCase();
  if (WORD_FIX_MAP.has(lowerWord)) {
    const fixed = WORD_FIX_MAP.get(lowerWord)!;
    return {
      ...entry,
      word: fixed,
      wordId: fixed.toLowerCase(),
    };
  }
  return entry;
}

function fixWordBatch(entries: WordBankEntry[]): WordBankEntry[] {
  return entries.map(fixWord);
}

/**
 * 加载 manifest（词库清单和统计）
 */
export async function loadWordBankManifest(): Promise<LoadState<WordBankManifest>> {
  if (manifestCache) {
    return { status: "loaded", data: manifestCache };
  }

  try {
    const res = await fetch("/data/v2/word-banks/manifest.json");
    if (!res.ok) {
      return {
        status: "error",
        error: `加载 manifest 失败: HTTP ${res.status}`,
      };
    }
    const data: WordBankManifest = await res.json();
    manifestCache = data;
    return { status: "loaded", data };
  } catch (e) {
    return {
      status: "error",
      error: `加载 manifest 异常: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/**
 * 加载指定词库的全部单词
 * @param bankId 词包 id（cet4 / cet6 / kaoyan / zhuanshengben / ielts）
 */
export async function loadWordBank(
  bankId: string
): Promise<LoadState<WordBankEntry[]>> {
  // 缓存命中
  const cached = bankCache.get(bankId);
  if (cached) {
    return { status: "loaded", data: cached };
  }

  try {
    const res = await fetch(`/data/v2/word-banks/${bankId}.json`);
    if (!res.ok) {
      return {
        status: "error",
        error: `加载词库 ${bankId} 失败: HTTP ${res.status}`,
      };
    }
    const data: WordBankEntry[] = await res.json();
    // 修正解析错误并去重
    const fixed = fixWordBatch(data);
    // 去重（按 wordId）
    const seen = new Set<string>();
    const deduped: WordBankEntry[] = [];
    for (const entry of fixed) {
      if (!seen.has(entry.wordId)) {
        seen.add(entry.wordId);
        deduped.push(entry);
      }
    }
    bankCache.set(bankId, deduped);
    return { status: "loaded", data: deduped };
  } catch (e) {
    return {
      status: "error",
      error: `加载词库 ${bankId} 异常: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/**
 * 清理词库缓存（用于切换用户/重置）
 */
export function clearWordBankCache(): void {
  manifestCache = null;
  bankCache.clear();
}

/**
 * 释义内可能出现的词性前缀：按「先长后短」匹配，避免 `n.` 抢掉 `n. v.` 的边界。
 * 仅在 token 出现在串首 / 前一字符是分隔符（空格 / 斜杠 / 标点）时被识别为词性标记，
 * 避免把句中的 `a.` 之类误判。
 */
const POS_TOKENS = [
  "abbr.",
  "prep.",
  "conj.",
  "pron.",
  "adj.",
  "adv.",
  "art.",
  "vt.",
  "vi.",
  "ad.",
  "n.",
  "v.",
  "a.",
] as const;

function isPosBoundaryBefore(s: string, i: number): boolean {
  if (i === 0) return true;
  const ch = s[i - 1];
  return /[\s\/、，；,;·\|]/.test(ch);
}

function isPosBoundaryAfter(s: string, i: number): boolean {
  if (i >= s.length) return true;
  return /\s/.test(s[i]);
}

/**
 * 将 raw meaning 拆出词性与纯中文释义：
 * - 去掉外层多余引号（含中文引号）；
 * - 顺序扫描，遇到 POS token 视为新段；
 * - 多个段用 `/` 拼接；
 * - 若入参 partOfSpeech 已显式给出则优先使用，否则用扫描出来的 POS 序列。
 */
export function cleanMeaningAndPos(
  rawMeaning: string,
  partOfSpeechIn: string,
): { meaning: string; pos: string } {
  let s = String(rawMeaning ?? "").trim();
  // 去除一对外层引号（英文 / 中文 / 反引号），允许多重嵌套
  for (let guard = 0; guard < 3; guard++) {
    const next = s.replace(/^["'`\u201C\u201D\u300C\u300D]+/, "").replace(/["'`\u201C\u201D\u300C\u300D]+$/, "");
    if (next === s) break;
    s = next.trim();
  }
  if (!s) return { meaning: "", pos: (partOfSpeechIn ?? "").trim() };

  const parts: string[] = [];
  const posList: string[] = [];
  let buf = "";
  let i = 0;
  while (i < s.length) {
    let matched: string | null = null;
    if (isPosBoundaryBefore(s, i)) {
      for (const t of POS_TOKENS) {
        if (s.substr(i, t.length) === t && isPosBoundaryAfter(s, i + t.length)) {
          matched = t;
          break;
        }
      }
    }
    if (matched) {
      const trimmed = buf.trim();
      if (trimmed) parts.push(trimmed);
      buf = "";
      if (!posList.includes(matched)) posList.push(matched);
      i += matched.length;
      while (i < s.length && /\s/.test(s[i])) i++;
      continue;
    }
    buf += s[i];
    i++;
  }
  const tail = buf.trim();
  if (tail) parts.push(tail);

  const meaning = parts.map((p) => p.replace(/^[\/\s,;]+|[\/\s,;]+$/g, "").trim()).filter(Boolean).join(" / ");
  const posExplicit = (partOfSpeechIn ?? "").trim();
  const pos = posExplicit ? posExplicit : posList.join(" / ");
  return { meaning: meaning || s, pos };
}

/**
 * V2 页面兼容：将 WordBankEntry 转为页面使用的 WordItem。
 * 在此处清洗 meaning / partOfSpeech，避免改动真实 JSON 源文件。
 */
export function bankEntryToWordItem(
  entry: WordBankEntry,
  extra?: { mistakeSources?: any[]; alsoIn?: string[] }
): any {
  const { meaning, pos } = cleanMeaningAndPos(entry.meaning || "", entry.partOfSpeech || "");
  return {
    word: entry.word,
    phonetic: entry.phonetic || "音标待补",
    pos: pos || "",
    cn: meaning || "",
    example: entry.example || "例句待补",
    exampleCn: entry.exampleCn || "",
    review: false,
    mistakeSources: extra?.mistakeSources ?? [],
    alsoIn: extra?.alsoIn ?? entry.belongsTo ?? [],
    // 保留原始标记
    _phoneticMissing: entry.phoneticMissing,
  };
}
