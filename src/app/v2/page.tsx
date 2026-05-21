// @ts-nocheck
"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/v2/Badge";
import { GroupHeader } from "@/components/v2/GroupHeader";
import { HighlightedExample } from "@/components/v2/HighlightedExample";
import { PageHeader } from "@/components/v2/PageHeader";
import { DeviceShell } from "@/v2/shells/DeviceShell";
import { Progress } from "@/components/v2/Progress";
import { SectionTitle } from "@/components/v2/SectionTitle";
import { Surface } from "@/components/v2/Surface";
import { WordUnitFilterPanel } from "@/components/v2/WordUnitFilterPanel";
import { tabs } from "@/data/v2/tabs";
import { todayTasks } from "@/data/v2/homeData";
import { aiScenes, shadowDrillByType, shadowStages, shadowTypes, speeds, trainingCards } from "@/data/v2/trainingData";
import { personalPackMeta, personalPackWords, sampleWords, wordGroups } from "@/data/v2/wordData";
import {
  bootstrapCloudSync,
  signOutCloudSync,
  syncChatState,
  syncLearningState,
  type CloudSyncProfile,
} from "@/lib/v2/cloudbaseSync";
import { createChatSession, loadChatMessages, loadChatSessions, saveChatMessages, saveChatSessions, type V2ChatMessage, type V2ChatSession } from "@/lib/v2/chatLocal";
import {
  BANK_LABELS,
  LABEL_TO_BANK_ID,
  bankEntryToWordItem,
  clearWordBankCache,
  loadWordBank,
  loadWordBankManifest,
  type WordBankManifest,
  type WordBankEntry,
} from "@/lib/v2/wordBankLoader";
import { bankDisplayLabel, countWordsInGroups, lemmasFromSelectedGroups, loadWordBankGroups, resolveBankIdForPack, type WordBankGroupsDoc } from "@/lib/v2/wordBankGroups";
import { playQwenAiChat, queueLearnExampleQwenSpeech, speakText, warmUpVoiceProviders, VOICE_GENDERS, type VoiceGender } from "@/lib/v2/voice";
import { chatUiToApiMessages, requestQwenFreeChat } from "@/lib/v2/qwenTextChatApi";
import { requestQwenSpeechToText } from "@/lib/v2/qwenSpeechToTextApi";
import { mineGroups, studyRecords } from "@/data/v2/mineData";
import { parsedPhrases, parsedSentences, parsedWords, sceneScript, shadowLines, usefulExpressions } from "@/data/v2/workbenchData";
import { writingMap, writingStages, writingTypes } from "@/data/v2/writingData";
import {
  defaultFavorites,
  defaultMistakes,
  loadFavorites,
  loadMistakes,
  loadRecentLearning,
  loadUiFlags,
  loadMistakeWordLearning,
  loadFavoriteWordLearning,
  loadWordLearning,
  makeWordId,
  makeWordKey,
  makeWorkbenchFavoriteId,
  makeWritingFavoriteId,
  parseWorkbenchFavoriteId,
  parseWritingFavoriteId,
  pushRecentLearning,
  saveMistakeWordLearning,
  saveFavoriteWordLearning,
  saveFavorites,
  saveUiFlags,
  saveWordLearning,
} from "@/lib/v2/storage";
import {
  buildMockCloudSession,
  clearPhoneAuth,
  loadSavedPhoneAuth,
  maskPhone,
  sendPhoneCode,
  verifyPhoneCode,
  type SavedPhoneAuthState,
} from "@/lib/v2/cloudUserAuth";

/** 收藏复习专用虚拟词包 id，不与 wordGroups 混用 */
const V2_FAVORITE_LEARN_PACK_ID = "__v2_favorite_words__";
const FAVORITE_VIRTUAL_PACK = { id: V2_FAVORITE_LEARN_PACK_ID, name: "我的收藏单词", total: 0, learned: 0, current: false, last: "" };

function isFavoriteLearnPack(pack) {
  return pack?.id === V2_FAVORITE_LEARN_PACK_ID;
}

const V2_MISTAKE_LEARN_PACK_ID = "__v2_mistake_words__";
const MISTAKE_VIRTUAL_PACK = { id: V2_MISTAKE_LEARN_PACK_ID, name: "错题库", total: 0, learned: 0, current: false, last: "" };

function isMistakeLearnPack(pack) {
  return pack?.id === V2_MISTAKE_LEARN_PACK_ID;
}

/** A-Z，大小写/重音不敏感，数字友好 */
function compareLearnLemmaAZ(a, b) {
  const wa = (a?.word ?? "").toLowerCase();
  const wb = (b?.word ?? "").toLowerCase();
  return wa.localeCompare(wb, "en", { sensitivity: "base", numeric: true });
}

/** 词条「核心」度：与清洗后 alsoIn（来自 belongsTo）条目数量一致 */
function learnCoreTagCount(w) {
  const arr = w?.alsoIn;
  return Array.isArray(arr) ? arr.length : 0;
}

/** 前端正序/乱序/核心优先；shufflePerm 为索引置换（乱序） */
function orderWordItemsForLearn(items, mode, shufflePerm) {
  const n = items?.length ?? 0;
  if (n === 0) return [];
  if (mode === "shuffle") {
    if (!shufflePerm || shufflePerm.length !== n) return items.slice();
    return shufflePerm.map((i) => items[i]);
  }
  const idx = Array.from({ length: n }, (_, i) => i);
  if (mode === "coreFirst") {
    idx.sort((i, j) => {
      const c = learnCoreTagCount(items[j]) - learnCoreTagCount(items[i]);
      if (c !== 0) return c;
      return compareLearnLemmaAZ(items[i], items[j]);
    });
  } else {
    idx.sort((i, j) => compareLearnLemmaAZ(items[i], items[j]));
  }
  return idx.map((i) => items[i]);
}

/** 与 shuffleSeed 一起用于稳定乱序（刷新后仍可复现同一轮） */
function seededShufflePermutation(n, seed) {
  let s = (Number(seed) >>> 0) || 1;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

/** 词包 id + 词条数参与乱序种子，换包或词表条数变化时自动换序 */
function learnOrderSaltPackId(packId) {
  let h = 2166136261;
  const s = String(packId ?? "");
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h >>> 0;
}

/** 构建当前学习用的「原始词条列表」（顺序由另一层 useMemo 处理） */
function buildLearnBaseWordSource(selectedPack, bankData, favoriteLearnWordItems, mistakeLearnWordItems) {
  if (isFavoriteLearnPack(selectedPack)) return favoriteLearnWordItems;
  if (isMistakeLearnPack(selectedPack)) return mistakeLearnWordItems;
  if (selectedPack.id === "personal-language-parse") return personalPackWords;
  const bid = LABEL_TO_BANK_ID[selectedPack.name];
  if (bid && bankData[bid]) return bankData[bid].map((e) => bankEntryToWordItem(e));
  return sampleWords;
}

/**
 * 出错类别：仅使用词条 `mistakeSources`（取 pack）；去重并保持录入顺序。
 * 兼容旧数据：`mistakeSources` 可为 string[]。
 */
function mistakeSourceNames(item) {
  if (!item || typeof item !== "object") return [];
  const raw = item.mistakeSources;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const seen = new Set();
  const out = [];
  for (const s of raw) {
    let p = "";
    if (typeof s === "string") p = s.trim();
    else if (s && typeof s === "object" && typeof s.pack === "string") p = s.pack.trim();
    if (!p || seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

/** 「也属于」仅用词条 alsoIn；剔除与出错类别重复的包名 */
function alsoInDisplayNames(item, mistakePacks) {
  const raw = item?.alsoIn;
  if (!Array.isArray(raw)) return [];
  const ex = new Set(mistakePacks || []);
  const seen = new Set();
  const out = [];
  for (const x of raw) {
    if (typeof x !== "string") continue;
    const p = x.trim();
    if (!p || ex.has(p) || seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

/**
 * 用本地 mistakes（来自 localStorage）→ 可展示词条行。
 * 没有本地数据时返回空数组：不注入任何 demo 错题。
 * 词条详情优先用 mistakes 项本身字段，未补全时回查词表 seed（fallback）。
 */
function buildMistakeRows(mistakeItems) {
  const list = Array.isArray(mistakeItems) ? mistakeItems : [];
  const rows = [];
  for (const entry of list) {
    if (!entry || !entry.word) continue;
    const lemma = makeWordId(entry.wordId || entry.word);
    const seedItem = resolveWordItemByLemma(lemma);
    const explicitPacks = Array.isArray(entry.packs) ? entry.packs.filter((p) => typeof p === "string" && p.trim()) : [];
    const mistakeSourcePacks = explicitPacks.length ? explicitPacks : seedItem ? mistakeSourceNames(seedItem) : [];
    const item = seedItem ?? {
      word: entry.word,
      phonetic: "",
      pos: "",
      cn: "",
      example: "",
      exampleCn: "",
      review: false,
      mistakeSources: explicitPacks.map((p) => ({ pack: p })),
      alsoIn: [],
    };
    rows.push({
      wordId: lemma,
      item,
      category: entry.category || "",
      reason: entry.reason || "",
      action: entry.action || "",
      mistakeSourcePacks,
    });
  }
  return rows;
}

function getMistakeLibPillOptionsFromRows(rows) {
  const packSet = new Set();
  let hasEmpty = false;
  for (const r of rows) {
    if (!r.mistakeSourcePacks?.length) hasEmpty = true;
    else for (const p of r.mistakeSourcePacks) packSet.add(p);
  }
  const sorted = [...packSet].sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  const opts = [{ value: "all", label: "全部错题" }, ...sorted.map((p) => ({ value: p, label: p }))];
  if (hasEmpty) opts.push({ value: "__none__", label: "未记录来源" });
  return opts;
}

function filterMistakeRows(rows, filterKey, queryRaw) {
  const q = queryRaw.trim().toLowerCase();
  return rows.filter((r) => {
    const packs = r.mistakeSourcePacks || [];
    let hit = filterKey === "all";
    if (!hit) {
      if (filterKey === "__none__") hit = packs.length === 0;
      else hit = packs.includes(filterKey);
    }
    const sourcesStr = packs.join(" ");
    const alsoStr = alsoInDisplayNames(r.item, packs).join(" ");
    const hay = [r.item.word, r.item.cn, r.item.phonetic, r.item.pos, r.reason, r.category, r.action, sourcesStr, alsoStr].join(" ").toLowerCase();
    return hit && (!q || hay.includes(q));
  });
}

function mistakeOccurrenceCountFromItems(items, lemmaLower) {
  if (!Array.isArray(items)) return 0;
  let n = 0;
  for (const it of items) {
    if (!it) continue;
    const key = (it.wordId || makeWordId(it.word || "")).toLowerCase();
    if (key === lemmaLower) n++;
  }
  return n;
}

function getFavoriteSourceLineForLemma(wordFavorites, findPackById, lemmaLower) {
  const rows = buildAllFavoriteRows(wordFavorites, findPackById);
  const row = rows.find((r) => r.wordId === lemmaLower);
  return row?.displaySource ?? "未记录来源";
}
function getFavoriteLearnWordItems(wordFavorites, findPackById, packFilter, search) {
  const allFavRows = buildAllFavoriteRows(wordFavorites, findPackById);
  const filteredByPack = filterFavoriteRowsByPack(allFavRows, packFilter);
  const favRows = filterFavoriteRowsBySearch(filteredByPack, search);
  return favRows.map((r) => r.item);
}

/** 与服务端首帧一致：不读 localStorage，仅默认 seed（与 pickWordResume 兜底相同） */
function getSeedWordResume() {
  const defaultPack = wordGroups[0].items[0];
  const idx = Math.min(17, Math.max(0, sampleWords.length - 1));
  return { pack: defaultPack, idx, src: sampleWords, resumeLemma: sampleWords[idx]?.word ?? "" };
}

/** 当前词包所属分组与词包对象（含个人词包） */
function findPackContext(packId) {
  if (!packId) return null;
  for (const g of wordGroups) {
    const p = g.items.find((x) => x.id === packId);
    if (p) return { savedFromGroupId: g.title, savedFromGroupName: g.title, pack: p };
  }
  if (packId === personalPackMeta.id) {
    return { savedFromGroupId: "personal", savedFromGroupName: "个人词包", pack: personalPackMeta };
  }
  return null;
}

function resolveWordItemByLemma(lemmaLower) {
  const s = sampleWords.find((w) => w.word.toLowerCase() === lemmaLower);
  if (s) return s;
  return personalPackWords.find((w) => w.word.toLowerCase() === lemmaLower) ?? null;
}

/** 所有在现行词表逻辑下「可出现该词」的词包名（未知来源时用于「也属于」全集） */
function allPackNamesContainingLemma(lemmaLower) {
  const inSample = sampleWords.some((w) => w.word.toLowerCase() === lemmaLower);
  const inPersonal = personalPackWords.some((w) => w.word.toLowerCase() === lemmaLower);
  if (!inSample && !inPersonal) return [];
  const names = [];
  if (inSample) {
    for (const g of wordGroups) {
      for (const p of g.items) {
        names.push(p.name);
      }
    }
  }
  if (inPersonal) {
    names.push(personalPackMeta.name);
  }
  return [...new Set(names)].filter(Boolean);
}

/** 共享词表时，其它包含该词（同一套 data）的词包名 */
function alsoPackNamesForLemma(lemmaLower, excludePackId) {
  const all = allPackNamesContainingLemma(lemmaLower);
  if (!excludePackId) return all;
  const ex = excludePackId;
  return all.filter((n) => {
    const p = allPacksByName().get(n);
    return p && p.id !== ex;
  });
}

/** name -> pack 映射（重名取第一个） */
function allPacksByName() {
  const m = new Map();
  for (const g of wordGroups) {
    for (const p of g.items) {
      if (!m.has(p.name)) m.set(p.name, p);
    }
  }
  if (!m.has(personalPackMeta.name)) m.set(personalPackMeta.name, personalPackMeta);
  return m;
}

/**
 * 展示用来源：优先 savedFromPackName；否则用 savedFromPackId 反查；
 * 仅当词只出现在个人词包、且无名无 id 时兜底个人词包；共享词表多词包不猜测。
 */
function resolvePackMetaForFavoriteEntry(entry, findPackById) {
  const nameTrim = entry.savedFromPackName?.trim();
  if (nameTrim) return { packId: entry.savedFromPackId, packName: nameTrim, unknown: false };
  const id = entry.savedFromPackId;
  if (id) {
    const pack = findPackById(id) || (id === personalPackMeta.id ? personalPackMeta : null);
    if (pack?.name) return { packId: pack.id, packName: pack.name, unknown: false };
  }
  const lemma = (entry.wordId || makeWordId(entry.word || "")).toLowerCase();
  const inSample = sampleWords.some((w) => w.word.toLowerCase() === lemma);
  const inPersonal = personalPackWords.some((w) => w.word.toLowerCase() === lemma);
  if (inPersonal && !inSample) {
    return { packId: personalPackMeta.id, packName: personalPackMeta.name, unknown: false };
  }
  return { packId: id || "", packName: "", unknown: true };
}

/** hydrate 后把仅有 packId、缺 packName 的旧条目补全并写回 */
function patchWordFavoritesFromPackIds(favoritesState, findPackById) {
  const list = favoritesState.wordFavorites || [];
  let changed = false;
  const next = list.map((e) => {
    if (e.savedFromPackName?.trim()) return e;
    const id = e.savedFromPackId;
    if (!id) return e;
    const pack = findPackById(id) || (id === personalPackMeta.id ? personalPackMeta : null);
    if (!pack?.name) return e;
    const ctx = findPackContext(id);
    changed = true;
    return {
      ...e,
      savedFromPackName: pack.name,
      savedFromGroupId: ctx?.savedFromGroupId ?? e.savedFromGroupId ?? "",
      savedFromGroupName: ctx?.savedFromGroupName ?? e.savedFromGroupName ?? "",
    };
  });
  if (!changed) return favoritesState;
  return { ...favoritesState, wordFavorites: next };
}

function getFavoriteSourcePillOptions() {
  const opts = [{ value: "all", label: "全部收藏" }];
  for (const g of wordGroups) {
    for (const p of g.items) {
      opts.push({ value: p.name, label: p.name });
    }
  }
  opts.push({ value: personalPackMeta.name, label: personalPackMeta.name });
  opts.push({ value: "__unknown__", label: "未记录来源" });
  return opts;
}

function buildAllFavoriteRows(wordFavorites, findPackById) {
  const by = new Map();
  for (const e of wordFavorites || []) {
    if (!e.wordId) continue;
    const wid = e.wordId.toLowerCase();
    if (!by.has(wid)) by.set(wid, []);
    by.get(wid).push(e);
  }
  const rows = [];
  for (const [wid, ents] of by.entries()) {
    const sorted = [...ents].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    const primary = sorted[0];
    const resolved = resolvePackMetaForFavoriteEntry(primary, findPackById);
    const sourceUnknown = resolved.unknown;
    const displaySource = sourceUnknown ? "未记录来源" : resolved.packName;
    let item = resolveWordItemByLemma(wid);
    if (!item) {
      item = {
        word: primary.word || wid,
        phonetic: '',
        pos: '',
        cn: '',
        example: '',
        exampleCn: '',
        review: false,
        mistakeSources: [],
        alsoIn: sourceUnknown ? [] : [displaySource],
      };
    }
    const also = sourceUnknown ? allPackNamesContainingLemma(wid) : alsoPackNamesForLemma(wid, resolved.packId);
    const maxAt = Math.max(...ents.map((x) => x.savedAt || 0), 0);
    rows.push({
      wordId: wid,
      item,
      primary,
      also,
      maxAt,
      resolvedPackId: resolved.packId,
      displaySource,
      sourceUnknown,
    });
  }
  rows.sort((a, b) => b.maxAt - a.maxAt);
  return rows;
}

function filterFavoriteRowsByPack(rows, filterKey) {
  if (filterKey === "all") return rows;
  if (filterKey === "__unknown__") return rows.filter((r) => r.sourceUnknown);
  return rows.filter((r) => r.displaySource === filterKey || r.also.includes(filterKey));
}

function filterFavoriteRowsBySearch(rows, queryRaw) {
  const q = queryRaw.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) => {
    const alsoStr = r.also.join(" ").toLowerCase();
    const blob = [
      r.item.word,
      r.item.cn,
      r.item.phonetic,
      r.item.example,
      r.item.exampleCn,
      r.displaySource,
      ...r.also,
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes(q) || alsoStr.includes(q);
  });
}

function isWordFavoritedFromPack(wordFavorites, packId, lemmaDisplay) {
  const wid = makeWordId(lemmaDisplay);
  return (wordFavorites || []).some((e) => e.savedFromPackId === packId && e.wordId === wid);
}

function uniqueWordIdCount(wordFavorites) {
  const s = new Set();
  for (const e of wordFavorites || []) {
    if (e.wordId) s.add(e.wordId.toLowerCase());
  }
  return s.size;
}

/** 收藏时间展示（与预览稿风格一致；savedAt≤0 时返回空） */
function formatFavoriteSavedAt(savedAt) {
  if (typeof savedAt !== "number" || savedAt <= 0) return "";
  try {
    const d = new Date(savedAt);
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diffDays = Math.round((startToday - startThat) / 86400000);
    const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    if (diffDays === 0) return `今天 ${hm}`;
    if (diffDays === 1) return `昨天 ${hm}`;
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  } catch {
    return "";
  }
}

const freeChatModes = ["消息模式", "电话模式"];
/** AI 对话页音色文案仅「女声 / 男声」；对内映射千问 TTS 音色 */
const FREE_CHAT_VOICE_MODEL = { 女声: "Cherry", 男声: "Ethan" };
function getFreeChatVoiceModel(uiLabel: VoiceGender) {
  return FREE_CHAT_VOICE_MODEL[uiLabel] ?? "Cherry";
}
const freeChatScenes = ["自由聊天", ...aiScenes];
const freeChatWordTips = {
  practice: { word: "practice", pos: "v. / n.", cn: "练习；训练", note: "常见搭配：practice speaking English" },
  speaking: { word: "speaking", pos: "n.", cn: "口语；说话", note: "spoken English 常指英语口语能力" },
  favorite: { word: "favorite", pos: "adj. / n.", cn: "最喜欢的；特别喜欢的人或物", note: "另一常见拼写为 favourite（多一个字母 u）" },
  tired: { word: "tired", pos: "adj.", cn: "疲惫的；累的", note: "I feel tired today. 表示今天有点累" },
  relax: { word: "relax", pos: "v.", cn: "放松", note: "relax a little 表示先放松一下" },
};
const freeChatWordPattern = new RegExp(`(${Object.keys(freeChatWordTips).join("|")})`, "gi");
const freeChatInitialMessages = [
  {
    id: 1,
    role: "ai",
    text: "Hi, I'm glad you're here — feel free to talk about anything in English. What's on your mind today?",
    cn: "很高兴见到你，我们可以用英语随便聊聊。今天想聊点什么？",
    time: "18:40",
  },
];

/** 字幕：user / ai 统一用 cn（用户句在入列后用接口返回的 userCn 写入 cn） */
function getFreeChatSubtitle(msg) {
  if (!msg) return "";
  const c = typeof msg.cn === "string" ? msg.cn.trim() : "";
  return c || "翻译生成中…";
}

function cx(...items) {
  return items.filter(Boolean).join(" ");
}

function FreeChatSheet({ open, onClose, title, subtitle, children }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/30 p-0 backdrop-blur-[2px]">
      <div className="w-full rounded-t-[28px] bg-[#FFF8EA] p-4 shadow-[0_-20px_50px_rgba(0,0,0,0.18)] ring-1 ring-[#E6D8BF]">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#D8C7AE]" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[18px] font-bold text-[#2C241C]">{title}</div>
            <p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-[#F5E8D4] px-4 py-2 text-[12px] font-bold text-[#6B5B49] active:scale-95">
            完成
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function FreeChatPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "shrink-0 rounded-full px-4 py-2 text-[12px] font-bold transition active:scale-95",
        active ? "bg-[#3A2A1A] text-white" : "bg-white text-[#6B5B49] ring-1 ring-[#E6D8BF]",
      )}
    >
      {children}
    </button>
  );
}

function BubbleText({ text, onWordClick }) {
  const parts = text.split(freeChatWordPattern);
  return (
    <span>
      {parts.map((part, index) => {
        const tip = freeChatWordTips[part?.toLowerCase?.()];
        if (!tip) return <span key={`${part}-${index}`}>{part}</span>;
        return (
          <button
            key={`${part}-${index}`}
            type="button"
            onClick={() => onWordClick(tip)}
            className="rounded-md underline decoration-dotted underline-offset-4"
          >
            {part}
          </button>
        );
      })}
    </span>
  );
}

function WordHintCard({ tip, onClose }) {
  if (!tip) return null;
  return (
    <div className="absolute inset-x-4 bottom-[92px] z-40 rounded-[24px] bg-[#FFF8EA] p-4 shadow-[0_18px_40px_rgba(58,42,26,0.18)] ring-1 ring-[#E6D8BF]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-[22px] font-bold text-[#2C241C]">{tip.word}</div>
            <span className="rounded-full bg-[#F5E8D4] px-3 py-1 text-[11px] font-bold text-[#8A6324]">{tip.pos}</span>
          </div>
          <p className="mt-2 text-[14px] font-bold text-[#2C241C]">{tip.cn}</p>
          <p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">{tip.note}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full bg-[#F5E8D4] px-3 py-2 text-[11px] font-bold text-[#6B5B49] active:scale-95">
          关闭
        </button>
      </div>
    </div>
  );
}

function PhoneCallOverlay({
  open,
  voiceModel,
  subtitlesOn,
  onToggleSubtitles,
  /** idle | listening | paused，仅电话模式，与消息模式解耦 */
  micPhase,
  recording,
  transcribing,
  busy,
  /** TTS 正在播放本条回复 */
  audioPlaying = false,
  onStartListening,
  onPauseListening,
  onHangUp,
  latestMessage,
  /** 仅种子欢迎 AI 一句在会话中时：中间区显示短开场，不铺满长初始化台词 */
  soloSeedWelcome,
}) {
  if (!open) return null;
  const canTapMain = !busy && !transcribing;
  const subtitleLine =
    subtitlesOn && latestMessage?.role === "ai" && !soloSeedWelcome ? getFreeChatSubtitle(latestMessage) : "";
  const micLive = recording || micPhase === "listening";
  const canPauseActive = micLive && canTapMain;
  const pauseReadyClass = cx(
    "min-h-[52px] rounded-[17px] text-[13px] font-bold transition active:scale-[0.98]",
    !canPauseActive ? "cursor-not-allowed border border-white/22 bg-[#3D342C] text-[#EDE4D8] opacity-[0.92]" : "border border-[#CFBB8F]/85 bg-[#E8CF8A] text-[#2B2118] shadow-inner shadow-black/10",
  );
  const startReadyClass = cx(
    "min-h-[52px] rounded-[17px] text-[13px] font-bold transition active:scale-[0.98]",
    !canTapMain || micLive ? "cursor-not-allowed border border-white/22 bg-[#40362E] text-[#D9CFBF] opacity-[0.92]" : "border border-transparent bg-white text-[#2B2118] shadow-[0_6px_18px_rgba(0,0,0,0.12)]",
  );
  /** 简短状态徽章（长说明放在中间文案区会破坏沉浸） */
  const statusChip =
    transcribing ? "识别中"
    : busy ? "回复中"
    : audioPlaying ? "朗读"
    : micLive ? "收音"
    : micPhase === "paused" ? "已暂停"
    : "待接通";
  const btnMuted = cx("min-h-[52px] rounded-[17px] text-[13px] font-bold transition active:scale-[0.98]");

  return (
    <div
      className="absolute inset-0 z-[60] flex flex-col bg-gradient-to-b from-[#282018] via-[#1f1710] to-[#17110c] text-white ring-1 ring-black/35"
      data-voice-model={voiceModel}
    >
      {/* 顶：安全区内 · Alex / English Call · 状态 */}
      <header className="shrink-0 px-5 pt-[max(calc(env(safe-area-inset-top,0px)+10px),20px)] pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[19px] font-bold tracking-tight text-white">Alex</h1>
            <p className="mt-0.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/42">English Call</p>
          </div>
          <output className="shrink-0 text-right" aria-live="polite">
            <span className="inline-flex rounded-full border border-white/16 bg-black/18 px-3 py-1.5 text-[11px] font-bold text-[#E8CF8A]">{statusChip}</span>
          </output>
        </div>
      </header>

      {/* 中：视觉焦点 + 短文案 */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <div className="relative mb-10 flex shrink-0 items-center justify-center">
          <div className="relative flex h-[108px] w-[108px] items-center justify-center rounded-full bg-[#D8B65E]/12 ring-2 ring-[#D8B65E]/20">
            {micLive ? <div className="absolute -inset-3 animate-pulse rounded-full bg-[#D8B65E]/08" aria-hidden /> : null}
            <div className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gradient-to-br from-[#EADCA3] via-[#D8B65E] to-[#9A7432] text-[22px] font-black text-[#231a12] shadow-[0_14px_32px_rgba(0,0,0,0.35)]">
              A
            </div>
          </div>
        </div>

        <div className="w-full max-w-[288px] space-y-4 text-center">
          {soloSeedWelcome ? (
            <>
              <p className="text-[14px] font-semibold leading-relaxed tracking-[-0.01em] text-white/93">Hi, I&apos;m Alex. Let&apos;s practice English together.</p>
              <p className="text-[14px] font-semibold leading-relaxed tracking-[-0.01em] text-white/93">Say anything in English when you&apos;re ready.</p>
              <p className="text-[13px] font-medium leading-relaxed text-[#C9BEA8]/95">准备好后，说一句英文开始练习。</p>
            </>
          ) : (
            <>
              {latestMessage?.text ? (
                <>
                  <p className="line-clamp-4 text-[15px] font-semibold leading-relaxed tracking-[-0.01em] text-white/93">{latestMessage.text}</p>
                  {subtitleLine ? <p className="line-clamp-3 pt-1 text-[12px] leading-relaxed text-white/62">{subtitleLine}</p> : null}
                </>
              ) : (
                <>
                  <p className="text-[14px] font-semibold leading-relaxed tracking-[-0.01em] text-white/93">Hi, I&apos;m Alex. Let&apos;s practice English together.</p>
                  <p className="text-[14px] font-semibold leading-relaxed tracking-[-0.01em] text-white/93">Say anything in English when you&apos;re ready.</p>
                  <p className="text-[13px] font-medium leading-relaxed text-[#C9BEA8]/95">准备好后，说一句英文开始练习。</p>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* 底：两行四键 + 底部安全距离 */}
      <footer className="shrink-0 space-y-3 px-5" style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom, 14px))" }}>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onToggleSubtitles}
            className={cx(
              btnMuted,
              subtitlesOn ? "border border-[#EADCA3]/50 bg-[#F4D58B] text-[#231a12] shadow-inner shadow-black/10" : "border border-white/22 bg-[#332B24] text-[#F6E9C6]",
            )}
          >
            {subtitlesOn ? "字幕开" : "字幕关"}
          </button>
          <button type="button" disabled={!canTapMain || micLive} onClick={onStartListening} className={startReadyClass}>
            开始
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" disabled={!canPauseActive} onClick={onPauseListening} className={pauseReadyClass}>
            暂停
          </button>
          <button
            type="button"
            onClick={onHangUp}
            className={cx(btnMuted, "border border-[#8F4F48]/65 bg-[#7A3932]/55 text-[#FDEBEA] backdrop-blur-[1px] hover:bg-[#7A3932]/65")}
          >
            挂断
          </button>
        </div>
      </footer>
    </div>
  );
}

export default function WordRealmCleanPreview() {
  const [activeTab, setActiveTab] = useState("home");
  const [wordPage, setWordPage] = useState("list");
  const [selectedPack, setSelectedPack] = useState(wordGroups[0].items[0]);
  const [wordIndex, setWordIndex] = useState(0);
  const [reviewOnly, setReviewOnly] = useState(false);
  /** 单词学习页顺序：正序 / 乱序 / 核心优先（仅前端重排，不写回 JSON） */
  const [learnOrderMode, setLearnOrderMode] = useState("sequential");
  /** 乱序稳定种子（与词条数共同决定置换；持久化到 word-learning） */
  const [shuffleSeed, setShuffleSeed] = useState(1);
  const [loopPlay, setLoopPlay] = useState(false);
  const [trainingPage, setTrainingPage] = useState("overview");
  const [writingPage, setWritingPage] = useState("overview");
  const [writingStage, setWritingStage] = useState("四级");
  const [stage, setStage] = useState("四级");
  const [shadowPage, setShadowPage] = useState("overview");
  const [shadowType, setShadowType] = useState("学段短句");
  const [shadowIndex, setShadowIndex] = useState(0);
  const [voice, setVoice] = useState<VoiceGender>("女声");
  /** 例句播放按钮：仅在例句 TTS 链路上使用 */
  const [learnExamplePhase, setLearnExamplePhase] = useState<"idle" | "preparing" | "playing">("idle");
  const learnExampleGenRef = useRef(0);
  const [speed, setSpeed] = useState("标准");
  const [scene, setScene] = useState("自由聊天");
  const [recording, setRecording] = useState(false);
  const [customText, setCustomText] = useState("");
  const [chatMode, setChatMode] = useState("消息模式");
  const [subtitlesOn, setSubtitlesOn] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  /** 电话模式收音状态机：idle 未开始 / listening 持续收音中 / paused 已暂停 */
  const [callPhoneMicPhase, setCallPhoneMicPhase] = useState("idle");
  /** 电话模式 MediaRecorder 是否正在运行（与消息模式 recording 分离） */
  const [callRecording, setCallRecording] = useState(false);
  const [chatSessions, setChatSessions] = useState<V2ChatSession[]>(() => loadChatSessions(freeChatInitialMessages).sessions);
  const [currentChatSessionId, setCurrentChatSessionId] = useState(() => loadChatSessions(freeChatInitialMessages).currentSessionId);
  const [chatMessages, setChatMessages] = useState<V2ChatMessage[]>(() => {
    const store = loadChatSessions(freeChatInitialMessages);
    const current = store.sessions.find((item) => item.id === store.currentSessionId) ?? store.sessions[0];
    return current?.messages ?? loadChatMessages(freeChatInitialMessages);
  });
  /** AI 文本多轮：云函数请求进行中时禁止叠加上一条 */
  const [chatAiBusy, setChatAiBusy] = useState(false);
  const [chatTranscribing, setChatTranscribing] = useState(false);
  const [chatAudioLoadingId, setChatAudioLoadingId] = useState<number | null>(null);
  const [cloudSyncProfile, setCloudSyncProfile] = useState<CloudSyncProfile | null>(null);
  const [cloudSyncBusy, setCloudSyncBusy] = useState(false);
  const [cloudSyncNotice, setCloudSyncNotice] = useState("本地模式");
  const [phoneAuthState, setPhoneAuthState] = useState<SavedPhoneAuthState | null>(null);
  const [phoneAuthHydrated, setPhoneAuthHydrated] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneCodeInput, setPhoneCodeInput] = useState("");
  const [phoneNicknameInput, setPhoneNicknameInput] = useState("");
  const [phoneAuthMode, setPhoneAuthMode] = useState<"mock" | "sms">("mock");
  const [selectedWordTip, setSelectedWordTip] = useState(null);
  const [toast, setToast] = useState("");
  const [minePage, setMinePage] = useState("overview");
  const [mistakeFilter, setMistakeFilter] = useState("发音易错");
  const [recordFilter, setRecordFilter] = useState("全部");
  const [openWordGroups, setOpenWordGroups] = useState({ "升学备考组": true, "基础学段组": false });
  const [workbenchPage, setWorkbenchPage] = useState("overview");
  const [sceneInput, setSceneInput] = useState("在机场办理值机，询问行李托运和登机口");
  const [hasRecentGenerate, setHasRecentGenerate] = useState(false);
  const [textInput, setTextInput] = useState("Learning a language requires patience and regular practice. Students should review new words, read short passages, and use useful expressions in real conversations.");
  const [hasRecentParse, setHasRecentParse] = useState(false);
  const [hasPersonalPack, setHasPersonalPack] = useState(false);
  const [showFullSceneResult, setShowFullSceneResult] = useState(false);
  const [showFullTextResult, setShowFullTextResult] = useState(false);
  const [showAllWritingItems, setShowAllWritingItems] = useState(false);
  const [writingSearch, setWritingSearch] = useState("");
  const [writingFilter, setWritingFilter] = useState("全部");
  const [favoriteWordPackFilter, setFavoriteWordPackFilter] = useState("all");
  const [favoriteWordSearch, setFavoriteWordSearch] = useState("");
  const [mistakeLibPackFilter, setMistakeLibPackFilter] = useState("all");
  const [mistakeWordSearch, setMistakeWordSearch] = useState("");
  const [wordLearnDetailOpen, setWordLearnDetailOpen] = useState(false);
  const [v2Hydrated, setV2Hydrated] = useState(false);
  const [bankManifest, setBankManifest] = useState<WordBankManifest | null>(null);
  const [bankData, setBankData] = useState<Record<string, WordBankEntry[]>>({});
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState("");
  const [bankGroupsDoc, setBankGroupsDoc] = useState<WordBankGroupsDoc | null>(null);
  /** 按 bankId 隔离单元筛选（cet4 / cet6 / kaoyan / zhuanshengben / ielts） */
  const [unitGroupByBank, setUnitGroupByBank] = useState<Record<string, { pick: string[]; applied: string[] }>>({});
  const [masteredWordKeys, setMasteredWordKeys] = useState([]);
  const [favorites, setFavorites] = useState(() => defaultFavorites());
  const [mistakesState, setMistakesState] = useState(() => defaultMistakes());
  const [recentLearning, setRecentLearning] = useState([]);
  const autoPlayedChatIdsRef = useRef(new Set<number>());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const chatScrollRef = useRef(null);
  const aiPageRef = useRef(null);
  const chatMessageIdRef = useRef(10);
  /** message：消息模式松手；callPause：电话点暂停；hangup：挂断丢弃录音 */
  const micStopReasonRef = useRef<"message" | "callPause" | "hangup">("message");

  useEffect(() => {
    learnExampleGenRef.current += 1;
    setLearnExamplePhase("idle");
  }, [wordIndex, selectedPack.id]);

  // 加载 manifest
  useEffect(() => {
    loadWordBankManifest().then((state) => {
      if (state.status === "loaded") {
        setBankManifest(state.data);
      }
    });
  }, []);

  const activeBankId = useMemo(
    () => resolveBankIdForPack(selectedPack),
    [selectedPack.id, selectedPack.name],
  );

  const unitGroupPickIds = activeBankId ? unitGroupByBank[activeBankId]?.pick ?? [] : [];
  const unitGroupAppliedIds = activeBankId ? unitGroupByBank[activeBankId]?.applied ?? [] : [];

  const patchUnitGroupForBank = useCallback((bankId: string, patch: Partial<{ pick: string[]; applied: string[] }>) => {
    if (!bankId) return;
    setUnitGroupByBank((prev) => {
      const cur = prev[bankId] ?? { pick: [], applied: [] };
      return { ...prev, [bankId]: { ...cur, ...patch } };
    });
  }, []);

  useEffect(() => {
    const bid = resolveBankIdForPack(selectedPack);
    if (!bid) {
      setBankGroupsDoc(null);
      return;
    }
    let cancelled = false;
    void loadWordBankGroups(bid).then((doc) => {
      if (!cancelled) setBankGroupsDoc(doc);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedPack.id, selectedPack.name]);

  const unitLemmaAllow = useMemo(
    () => lemmasFromSelectedGroups(bankGroupsDoc, unitGroupAppliedIds),
    [bankGroupsDoc, unitGroupAppliedIds],
  );

  const findPackById = useCallback((id) => {
    if (!id) return null;
    for (const g of wordGroups) {
      const p = g.items.find((x) => x.id === id);
      if (p) return p;
    }
    return null;
  }, []);

  const favoriteLearnWordItems = useMemo(
    () => getFavoriteLearnWordItems(favorites.wordFavorites, findPackById, favoriteWordPackFilter, favoriteWordSearch),
    [favorites.wordFavorites, findPackById, favoriteWordPackFilter, favoriteWordSearch],
  );

  const lastRealPackBeforeFavoriteRef = useRef(wordGroups[0].items[0]);

  const allMistakeRows = useMemo(() => buildMistakeRows(mistakesState.items), [mistakesState.items]);
  const mistakeLibPillOptions = useMemo(() => getMistakeLibPillOptionsFromRows(allMistakeRows), [allMistakeRows]);
  const mistakeLibOptionsKey = useMemo(
    () => mistakeLibPillOptions.map((o) => `${o.value}\t${o.label}`).join("|"),
    [mistakeLibPillOptions],
  );
  const mistakeLearnRows = useMemo(
    () => filterMistakeRows(allMistakeRows, mistakeLibPackFilter, mistakeWordSearch),
    [allMistakeRows, mistakeLibPackFilter, mistakeWordSearch],
  );
  const mistakeLearnWordItems = useMemo(() => mistakeLearnRows.map((r) => r.item), [mistakeLearnRows]);
  const mistakeLibTotalCount = allMistakeRows.length;

  const bankDataKeysSig = useMemo(
    () =>
      Object.keys(bankData)
        .sort()
        .map((id) => `${id}:${bankData[id]?.length ?? 0}`)
        .join(","),
    [bankData],
  );

  const favoriteWordIdsSig = useMemo(
    () =>
      !favorites.wordFavorites?.length
        ? ""
        : favorites.wordFavorites
            .map((e) => String(e.wordId ?? "").toLowerCase())
            .sort()
            .join(","),
    [favorites.wordFavorites],
  );

  const learnBaseDepsKey = useMemo(
    () =>
      [
        selectedPack.id,
        selectedPack.name,
        LABEL_TO_BANK_ID[selectedPack.name] ?? "",
        bankDataKeysSig,
        favoriteWordIdsSig,
        favoriteWordPackFilter,
        favoriteWordSearch,
        mistakeLibPackFilter,
        mistakeWordSearch,
        mistakeLearnWordItems.length,
        mistakeLearnWordItems[0]?.word ?? "",
        String(mistakeLibTotalCount),
      ].join("\u001f"),
    [
      selectedPack.id,
      selectedPack.name,
      bankDataKeysSig,
      favoriteWordIdsSig,
      favoriteWordPackFilter,
      favoriteWordSearch,
      mistakeLibPackFilter,
      mistakeWordSearch,
      mistakeLearnWordItems.length,
      mistakeLearnWordItems[0]?.word,
      mistakeLibTotalCount,
    ],
  );

  const learnBaseWordSource = useMemo(
    () => buildLearnBaseWordSource(selectedPack, bankData, favoriteLearnWordItems, mistakeLearnWordItems),
    [learnBaseDepsKey],
  );

  const learnDisplayWords = useMemo(() => {
    const base = buildLearnBaseWordSource(selectedPack, bankData, favoriteLearnWordItems, mistakeLearnWordItems);
    const perm =
      learnOrderMode === "shuffle"
        ? seededShufflePermutation(
            base.length,
            (((shuffleSeed >>> 0) ^ learnOrderSaltPackId(selectedPack.id) ^ (base.length * 0x85ebca6b)) >>> 0) || 1,
          )
        : null;
    const ordered = orderWordItemsForLearn(base, learnOrderMode, perm);
    let result = reviewOnly ? ordered.filter((w) => w.review) : ordered;
    if (unitGroupAppliedIds.length > 0 && unitLemmaAllow.size > 0 && bankGroupsDoc?.bankId === activeBankId) {
      result = result.filter((w) => unitLemmaAllow.has(String(w.word ?? "").trim().toLowerCase()));
    }
    return result;
  }, [learnBaseDepsKey, learnOrderMode, shuffleSeed, selectedPack.id, reviewOnly, unitGroupAppliedIds, unitLemmaAllow, bankGroupsDoc?.bankId, activeBankId]);

  const learnDisplayWordsRef = useRef(learnDisplayWords);
  learnDisplayWordsRef.current = learnDisplayWords;

  const masteredWordKeysRef = useRef(masteredWordKeys);
  masteredWordKeysRef.current = masteredWordKeys;

  const masteredKeysSig = useMemo(() => [...masteredWordKeys].sort().join("|"), [masteredWordKeys]);

  const mistakeOccurrenceCount = useCallback(
    (lemmaLower) => mistakeOccurrenceCountFromItems(mistakesState.items, lemmaLower),
    [mistakesState.items],
  );

  useEffect(() => {
    const valid = new Set(
      mistakeLibOptionsKey
        ? mistakeLibOptionsKey.split("|").map((seg) => seg.split("\t")[0]).filter(Boolean)
        : [],
    );
    if (!valid.has(mistakeLibPackFilter)) setMistakeLibPackFilter("all");
  }, [mistakeLibPackFilter, mistakeLibOptionsKey]);

  /**
   * 真实词库对应的「续学源」：
   * - 真实词库已加载 → 用真实条目（不混 seed 测试词）。
   * - 真实词库未加载（仅 manifest 有总数）→ 用 length 占位数组（idx/total 可用，lemma 留空）。
   * - 非真实词库且未加载到 → 回退 sampleWords（仅作兜底，与「seed 仅作加载失败兜底」一致）。
   */
  const wordSourceForResume = useCallback(
    (pack) => {
      if (!pack) return sampleWords;
      if (pack.id === "personal-language-parse") return personalPackWords;
      const bid = LABEL_TO_BANK_ID[pack.name];
      if (bid) {
        const arr = bankData[bid];
        if (arr) return arr.map((e) => ({ word: e.word }));
        const total = bankManifest?.[bid]?.count;
        if (typeof total === "number" && total > 0) return new Array(total).fill(null);
        return [];
      }
      return sampleWords;
    },
    [bankData, bankManifest],
  );

  /** 首页/继续：localStorage 最近一条词学习优先，其次 word-learning，最后默认四级第 18 词 */
  const pickWordResume = useCallback(() => {
    try {
      const recent = loadRecentLearning();
      for (const r of recent) {
        if (r.kind === "word" && r.packId) {
          const p = findPackById(r.packId);
          if (p) {
            const src = wordSourceForResume(p);
            const cap = Math.max(0, src.length - 1);
            const idx = Math.min(Math.max(0, r.wordIndex ?? 0), cap);
            const hint =
              typeof r.lemma === "string" && r.lemma.trim()
                ? r.lemma.trim()
                : (src[idx]?.word ?? "");
            return { pack: p, idx, src, resumeLemma: hint };
          }
        }
      }
      const wl = loadWordLearning();
      if (wl?.packId) {
        const p = findPackById(wl.packId);
        if (p) {
          const src = wordSourceForResume(p);
          const cap = Math.max(0, src.length - 1);
          const idx = Math.min(Math.max(0, wl.wordIndex ?? 0), cap);
          const hint =
            typeof wl.lastLearnLemma === "string" && wl.lastLearnLemma.trim()
              ? wl.lastLearnLemma.trim()
              : (src[idx]?.word ?? "");
          return { pack: p, idx, src, resumeLemma: hint };
        }
      }
    } catch {
      /* ignore */
    }
    const defaultPack = wordGroups[0].items[0];
    const src = wordSourceForResume(defaultPack);
    const idx = Math.min(17, Math.max(0, src.length - 1));
    return { pack: defaultPack, idx, src, resumeLemma: src[idx]?.word ?? "" };
  }, [findPackById, wordSourceForResume]);

  const addRecent = useCallback((item) => {
    const next = pushRecentLearning(item);
    setRecentLearning(next);
  }, []);

  const allocChatMessageId = useCallback(() => {
    chatMessageIdRef.current = Math.max(chatMessageIdRef.current + 1, Date.now());
    return chatMessageIdRef.current;
  }, []);

  const uniqueFavoriteWordCount = useMemo(() => uniqueWordIdCount(favorites.wordFavorites), [favorites.wordFavorites]);
  const favoritesSyncSig = useMemo(() => JSON.stringify(favorites), [favorites]);
  const mistakesSyncSig = useMemo(() => JSON.stringify(mistakesState), [mistakesState]);
  const recentLearningSyncSig = useMemo(() => JSON.stringify(recentLearning), [recentLearning]);
  const chatMessagesSyncSig = useMemo(() => JSON.stringify(chatMessages), [chatMessages]);

  const hydrateFromLocalState = useCallback(() => {
    try {
      const wl = loadWordLearning();
      const favRaw = loadFavorites();
      const fav = patchWordFavoritesFromPackIds(favRaw, findPackById);
      const recent = loadRecentLearning();
      const ui = loadUiFlags();
      const mistakes = loadMistakes();
      setMasteredWordKeys(wl?.masteredKeys ?? []);
      setFavorites(fav);
      setMistakesState(mistakes);
      setRecentLearning(recent);
      setHasPersonalPack(ui.hasPersonalPack);
      const chatStore = loadChatSessions(freeChatInitialMessages);
      setChatSessions(chatStore.sessions);
      setCurrentChatSessionId(chatStore.currentSessionId);
      const currentSession = chatStore.sessions.find((item) => item.id === chatStore.currentSessionId) ?? chatStore.sessions[0];
      setChatMessages(currentSession?.messages ?? loadChatMessages(freeChatInitialMessages));
      if (wl?.learnOrderMode === "sequential" || wl?.learnOrderMode === "shuffle" || wl?.learnOrderMode === "coreFirst") {
        setLearnOrderMode(wl.learnOrderMode);
      }
      if (typeof wl?.shuffleSeed === "number" && wl.shuffleSeed >= 0) {
        setShuffleSeed(Math.max(1, wl.shuffleSeed >>> 0));
      }
      const pos = pickWordResume();
      setSelectedPack(pos.pack);
      setWordIndex(pos.idx);
      if (wl?.packId && findPackById(wl.packId)) {
        const savedPack = findPackById(wl.packId);
        if (savedPack && savedPack.id === pos.pack.id) {
          setWordPage(wl.wordPage === "learn" || wl.wordPage === "list" ? wl.wordPage : "list");
          setReviewOnly(!!wl.reviewOnly);
        } else {
          setWordPage("list");
          setReviewOnly(false);
        }
      }
    } catch {
      /* keep defaults on malformed local state */
    }
  }, [findPackById, pickWordResume]);

  useEffect(() => {
    hydrateFromLocalState();
    setV2Hydrated(true);
  }, [hydrateFromLocalState]);

  useEffect(() => {
    const saved = loadSavedPhoneAuth();
    setPhoneAuthState(saved);
    if (saved) {
      setPhoneInput(saved.phone);
      setPhoneNicknameInput(saved.nickname || "");
      setPhoneAuthMode(saved.authMode === "sms" ? "sms" : "mock");
    }
    setPhoneAuthHydrated(true);
  }, []);

  useEffect(() => {
    if (!phoneAuthHydrated || !phoneAuthState) return;
    if (phoneAuthState.mockMode) {
      const mockSession = buildMockCloudSession(phoneAuthState);
      void (async () => {
        try {
          setCloudSyncBusy(true);
          const boot = await bootstrapCloudSync(freeChatInitialMessages, { phoneAuth: phoneAuthState, preferLocal: false });
          setCloudSyncProfile(boot.profile);
          setCloudSyncNotice(boot.pulledLearning ? "已从云端恢复学习进度" : "云端同步已连接，本地记录已同步到云端");
          setFavorites(loadFavorites());
          setMistakesState(loadMistakes());
        } catch {
          setCloudSyncProfile({
            uid: mockSession.uid,
            isAnonymous: false,
            loginType: mockSession.loginType,
            enabled: false,
            phone: mockSession.phone,
            phoneMasked: mockSession.phoneMasked,
            nickname: mockSession.nickname,
            avatar: mockSession.avatar,
            authMode: "mock",
            lastSyncedAt: mockSession.lastLoginAt,
          });
          setCloudSyncNotice("云端暂时不可用，当前使用本地模式");
        } finally {
          setCloudSyncBusy(false);
        }
      })();
      return;
    }
    void (async () => {
      try {
        setCloudSyncBusy(true);
        const boot = await bootstrapCloudSync(freeChatInitialMessages, { phoneAuth: phoneAuthState, preferLocal: false });
        setCloudSyncProfile(boot.profile);
        setCloudSyncNotice(boot.pulledLearning || boot.pulledChats ? "云端学习数据已载入" : "云同步已连接");
        setFavorites(loadFavorites());
        setMistakesState(loadMistakes());
      } catch {
        setCloudSyncNotice("当前使用本地模式");
      } finally {
        setCloudSyncBusy(false);
      }
    })();
  }, [phoneAuthHydrated, phoneAuthState]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    warmUpVoiceProviders();
    const onVoices = () => warmUpVoiceProviders();
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
  }, []);

  useEffect(() => {
    if (!v2Hydrated) return;
    try {
      if (isFavoriteLearnPack(selectedPack)) {
        saveFavoriteWordLearning({ currentIndex: wordIndex, updatedAt: Date.now() });
        const prev = loadWordLearning();
        const fallbackPack = wordGroups[0].items[0];
        const prevPackId =
          prev?.packId && findPackById(prev.packId) && prev.packId !== V2_FAVORITE_LEARN_PACK_ID && prev.packId !== V2_MISTAKE_LEARN_PACK_ID
            ? prev.packId
            : fallbackPack.id;
        saveWordLearning({
          packId: prevPackId,
          wordPage: prev?.wordPage === "learn" || prev?.wordPage === "list" ? prev.wordPage : "list",
          wordIndex: typeof prev?.wordIndex === "number" ? prev.wordIndex : 0,
          reviewOnly: !!prev?.reviewOnly,
          masteredKeys: masteredWordKeysRef.current,
          learnOrderMode,
          shuffleSeed: Math.max(1, shuffleSeed >>> 0),
          lastLearnLemma: prev?.lastLearnLemma ?? "",
        });
      } else if (isMistakeLearnPack(selectedPack)) {
        saveMistakeWordLearning({ currentIndex: wordIndex, updatedAt: Date.now() });
        const prev = loadWordLearning();
        const fallbackPack = wordGroups[0].items[0];
        const prevPackId =
          prev?.packId && findPackById(prev.packId) && prev.packId !== V2_FAVORITE_LEARN_PACK_ID && prev.packId !== V2_MISTAKE_LEARN_PACK_ID
            ? prev.packId
            : fallbackPack.id;
        saveWordLearning({
          packId: prevPackId,
          wordPage: prev?.wordPage === "learn" || prev?.wordPage === "list" ? prev.wordPage : "list",
          wordIndex: typeof prev?.wordIndex === "number" ? prev.wordIndex : 0,
          reviewOnly: !!prev?.reviewOnly,
          masteredKeys: masteredWordKeysRef.current,
          learnOrderMode,
          shuffleSeed: Math.max(1, shuffleSeed >>> 0),
          lastLearnLemma: prev?.lastLearnLemma ?? "",
        });
      } else {
        const prevWl = loadWordLearning();
        let lemmaPersist = prevWl?.lastLearnLemma ?? "";
        const dw = learnDisplayWordsRef.current;
        if (wordPage === "learn" && dw.length > 0) {
          lemmaPersist = dw[Math.min(Math.max(0, wordIndex), dw.length - 1)]?.word ?? "";
        }
        saveWordLearning({
          packId: selectedPack?.id ?? wordGroups[0].items[0].id,
          wordPage: wordPage === "favorites" || wordPage === "mistakes" ? "list" : wordPage,
          wordIndex,
          reviewOnly,
          masteredKeys: masteredWordKeysRef.current,
          learnOrderMode,
          shuffleSeed: Math.max(1, shuffleSeed >>> 0),
          lastLearnLemma: lemmaPersist,
        });
      }
    } catch {
      /* ignore */
    }
  }, [v2Hydrated, selectedPack?.id, wordPage, wordIndex, reviewOnly, masteredKeysSig, findPackById, learnOrderMode, shuffleSeed, learnDisplayWords.length]);

  useEffect(() => {
    if (!v2Hydrated) return;
    try {
      saveFavorites(favorites);
    } catch {
      /* ignore */
    }
  }, [v2Hydrated, favorites]);

  useEffect(() => {
    if (!v2Hydrated) return;
    saveChatMessages(chatMessages);
    const current = chatMessages.find((msg) => msg.role === "user" && msg.text.trim());
    const title = current ? (current.text.length > 20 ? `${current.text.slice(0, 20)}...` : current.text) : "新对话";
    setChatSessions((prev) => {
      const next = prev.map((item) => (
        item.id === currentChatSessionId
          ? { ...item, title, updatedAt: Date.now(), messages: chatMessages }
          : item
      ));
      saveChatSessions(next, currentChatSessionId);
      return next;
    });
  }, [chatMessages, currentChatSessionId, v2Hydrated]);

  useEffect(() => {
    if (!v2Hydrated || !cloudSyncProfile?.enabled) return;
    const timer = setTimeout(() => {
      void syncLearningState(cloudSyncProfile);
    }, 900);
    return () => clearTimeout(timer);
  }, [
    cloudSyncProfile,
    v2Hydrated,
    masteredKeysSig,
    favoritesSyncSig,
    mistakesSyncSig,
    recentLearningSyncSig,
    hasPersonalPack,
    selectedPack?.id,
    wordPage,
    wordIndex,
    reviewOnly,
    learnOrderMode,
    shuffleSeed,
  ]);

  useEffect(() => {
    if (!cloudSyncProfile?.enabled) return;
    const timer = setTimeout(() => {
      void syncChatState(cloudSyncProfile, freeChatInitialMessages);
    }, 900);
    return () => clearTimeout(timer);
  }, [cloudSyncProfile, chatMessagesSyncSig]);

  /** 已 hydrate 后，按「续学」目标预加载对应真实词库，让首页/单词库续学位显示真实词条而非 seed */
  useEffect(() => {
    if (!v2Hydrated) return;
    try {
      const candidates = new Set();
      const recent = loadRecentLearning();
      for (const r of recent) {
        if (r.kind === "word" && r.packId) {
          const p = findPackById(r.packId);
          if (p?.name && LABEL_TO_BANK_ID[p.name]) candidates.add(LABEL_TO_BANK_ID[p.name]);
        }
      }
      const wl = loadWordLearning();
      if (wl?.packId) {
        const p = findPackById(wl.packId);
        if (p?.name && LABEL_TO_BANK_ID[p.name]) candidates.add(LABEL_TO_BANK_ID[p.name]);
      }
      // 兜底：首屏默认推荐 cet4，但只有 manifest 已存在该词包时才发起请求
      const defaultBid = LABEL_TO_BANK_ID[wordGroups[0].items[0].name];
      if (defaultBid && bankManifest?.[defaultBid]) candidates.add(defaultBid);
      for (const bid of candidates) {
        if (!bankData[bid]) {
          loadWordBank(bid).then((state) => {
            if (state.status === "loaded") {
              setBankData((prev) => (prev[bid] ? prev : { ...prev, [bid]: state.data }));
            }
          });
        }
      }
    } catch {
      /* ignore */
    }
  }, [v2Hydrated, bankManifest, findPackById, bankDataKeysSig]);

  useEffect(() => {
    if (!v2Hydrated) return;
    try {
      saveUiFlags({ v: 1, hasPersonalPack });
    } catch {
      /* ignore */
    }
  }, [v2Hydrated, hasPersonalPack]);

  useEffect(() => {
    if (!v2Hydrated || activeTab !== "words" || wordPage !== "learn") return;
    const t = setTimeout(() => {
      try {
        const pack = selectedPack;
        const src = learnDisplayWordsRef.current;
        if (src.length === 0) return;
        const idx = Math.min(wordIndex, src.length - 1);
        const lemma = src[idx]?.word ?? "";
        const next = pushRecentLearning({
          id: `word-${pack.id}-${idx}`,
          kind: "word",
          label: `${pack.name} · ${lemma}`,
          packId: pack.id,
          wordIndex: idx,
          lemma,
        });
        setRecentLearning(next);
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [
    v2Hydrated,
    activeTab,
    wordPage,
    wordIndex,
    selectedPack.id,
    selectedPack.name,
    learnDisplayWords.length,
    learnOrderMode,
    shuffleSeed,
    reviewOnly,
    learnBaseDepsKey,
  ]);

  useEffect(() => {
    if (wordPage !== "learn") return;
    const n = learnDisplayWords.length;
    if (n <= 0) return;
    setWordIndex((i) => Math.min(Math.max(0, i), n - 1));
  }, [
    wordPage,
    learnDisplayWords.length,
    reviewOnly,
    learnOrderMode,
    shuffleSeed,
    selectedPack.id,
    learnBaseDepsKey,
  ]);

  useEffect(() => {
    if (wordPage !== "learn") return;
    if (!isFavoriteLearnPack(selectedPack) && !isMistakeLearnPack(selectedPack)) return;
    const n = isFavoriteLearnPack(selectedPack) ? favoriteLearnWordItems.length : mistakeLearnWordItems.length;
    setWordIndex((i) => {
      if (n <= 0) return 0;
      return Math.min(Math.max(0, i), n - 1);
    });
  }, [selectedPack?.id, wordPage, favoriteLearnWordItems.length, mistakeLearnWordItems.length, favoriteWordIdsSig]);

  useEffect(() => {
    setWordLearnDetailOpen(false);
  }, [wordIndex, selectedPack?.id, wordPage]);

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(""), 1500);
  };

  const latestChatMessage = chatMessages[chatMessages.length - 1];

  const playChatMessage = useCallback(async (msg) => {
    if (!msg?.text?.trim()) return false;
    const msgId = Number(msg.id ?? Date.now());
    setChatAudioLoadingId(msgId);
    try {
      const ok = await playQwenAiChat(msg.text, voice);
      if (!ok) showToast("浏览器英文语音不可用，请检查系统英语语音");
      return ok;
    } finally {
      setChatAudioLoadingId((current) => (current === msgId ? null : current));
    }
  }, [showToast, voice]);

  useEffect(() => {
    if (trainingPage !== "aiVoice") return;
    const el = chatScrollRef.current;
    if (!el) return;
    const id = window.setTimeout(() => {
      try {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      } catch {
        el.scrollTop = el.scrollHeight;
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [chatMessages, trainingPage]);

  useEffect(() => {
    const maxId = chatMessages.reduce((max, msg) => {
      const n = Number(msg?.id ?? 0);
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0);
    chatMessageIdRef.current = Math.max(chatMessageIdRef.current, maxId);
  }, [chatMessages]);

  const openChatSession = useCallback((sessionId) => {
    const target = chatSessions.find((item) => item.id === sessionId);
    if (!target) return;
    setCurrentChatSessionId(target.id);
    setChatMessages(target.messages);
    setHistoryOpen(false);
  }, [chatSessions]);

  const startNewChatSession = useCallback(() => {
    const session = createChatSession(freeChatInitialMessages);
    setChatAiBusy(false);
    setChatTranscribing(false);
    setChatAudioLoadingId(null);
    setCurrentChatSessionId(session.id);
    setChatMessages(session.messages);
    setChatSessions((prev) => {
      const next = [session, ...prev].slice(0, 16);
      saveChatSessions(next, session.id);
      return next;
    });
    setHistoryOpen(false);
    showToast("已开始新对话");
  }, [showToast]);

  const clearCurrentChatSession = useCallback(() => {
    const seed = createChatSession(freeChatInitialMessages);
    setChatAiBusy(false);
    setChatTranscribing(false);
    setChatAudioLoadingId(null);
    setChatMessages(seed.messages);
    setChatSessions((prev) => {
      const next = prev.map((item) => item.id === currentChatSessionId ? { ...item, title: "新对话", updatedAt: Date.now(), messages: seed.messages } : item);
      saveChatSessions(next, currentChatSessionId);
      return next;
    });
    showToast("已清空当前会话");
  }, [currentChatSessionId, showToast]);

  const cleanupChatRecorder = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    mediaStreamRef.current = null;
    mediaChunksRef.current = [];
  }, []);

  const pickChatRecorderMimeType = useCallback(() => {
    if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
      return "";
    }
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  }, []);

  const blobToDataUrl = useCallback((blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  }), []);

  useEffect(() => () => {
    cleanupChatRecorder();
  }, [cleanupChatRecorder]);

  useEffect(() => {
    if (!callOpen) return;
    micStopReasonRef.current = "message";
    cleanupChatRecorder();
    setCallRecording(false);
    setRecording(false);
    setCallPhoneMicPhase("idle");
  }, [callOpen, cleanupChatRecorder]);

  const pushFreeChatMessage = useCallback(
    (userText, source = "text") => {
      const content = userText.trim();
      if (!content) return;
      if (chatAiBusy) {
        showToast("请等待上一条回复完成");
        return;
      }
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const userId = allocChatMessageId();
      const userMsg = {
        id: userId,
        role: "user",
        text: content,
        cn: "翻译生成中…",
        time,
      };

      setRecording(false);
      setCallRecording(false);
      setChatAiBusy(true);

      const next = [...chatMessages, userMsg].slice(-24);
      setChatMessages(next);
      const apiMessages = chatUiToApiMessages(next);

      void (async () => {
        try {
          const reply = await requestQwenFreeChat({ scene, messages: apiMessages });
          const replyNow = new Date();
          const replyTime = `${String(replyNow.getHours()).padStart(2, "0")}:${String(replyNow.getMinutes()).padStart(2, "0")}`;
          const userSubtitle = reply.userCn.trim();
          const aiSubtitle = reply.cn.trim();
          if (reply.mode === "local") {
            showToast("本地模式：已使用离线回复");
          }
          setChatMessages((p) => {
            const patched = p.map((m) => (m.id === userId ? { ...m, cn: userSubtitle } : m));
              return [
                ...patched,
                {
                  id: allocChatMessageId(),
                  role: "ai",
                  text: reply.text,
                  cn: aiSubtitle,
                time: replyTime,
              },
            ].slice(-24);
          });
        } catch {
          showToast("AI 回复失败：在线与本地回复均不可用");
          setChatMessages((p) => p.map((m) => (m.id === userId ? { ...m, cn: "翻译暂不可用，请重试" } : m)));
        } finally {
          setChatAiBusy(false);
        }
      })();
    },
    [allocChatMessageId, chatAiBusy, chatMessages, scene, showToast],
  );

  const beginPressHoldStyleRecorder = useCallback(
    async (mode) => {
      if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        showToast("当前设备不支持录音");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        const mimeType = pickChatRecorderMimeType();
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mediaStreamRef.current = stream;
        mediaRecorderRef.current = recorder;
        mediaChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            mediaChunksRef.current.push(event.data);
          }
        };

        recorder.onerror = () => {
          cleanupChatRecorder();
          setRecording(false);
          setCallRecording(false);
          if (mode === "call") setCallPhoneMicPhase("paused");
          showToast("录音失败，请重试");
        };

        recorder.onstop = () => {
          const reason = micStopReasonRef.current;
          micStopReasonRef.current = "message";
          const chunks = [...mediaChunksRef.current];
          const finalMimeType = recorder.mimeType || mimeType || "audio/webm";
          cleanupChatRecorder();
          setRecording(false);
          setCallRecording(false);

          if (reason === "hangup") {
            return;
          }

          if (reason === "callPause") {
            setCallPhoneMicPhase("paused");
          }

          if (!chunks.length) {
            if (reason === "callPause" || reason === "message") {
              showToast("没有录到声音");
            }
            return;
          }

          const audioBlob = new Blob(chunks, { type: finalMimeType });
          if (audioBlob.size < 1024) {
            showToast("录音太短，请重试");
            return;
          }

          void (async () => {
            setChatTranscribing(true);
            try {
              const audioDataUrl = await blobToDataUrl(audioBlob);
              const transcript = await requestQwenSpeechToText({ audioDataUrl, mimeType: finalMimeType });
              if (!transcript.trim()) {
                throw new Error("Empty transcript");
              }
              pushFreeChatMessage(transcript, "voice");
            } catch {
              showToast("语音识别失败，请重试");
            } finally {
              setChatTranscribing(false);
            }
          })();
        };

        recorder.start();
        if (mode === "call") {
          setCallRecording(true);
          setCallPhoneMicPhase("listening");
        } else {
          setRecording(true);
        }
      } catch {
        cleanupChatRecorder();
        setRecording(false);
        setCallRecording(false);
        if (mode === "call") setCallPhoneMicPhase("paused");
        showToast("麦克风不可用，请检查权限");
      }
    },
    [blobToDataUrl, cleanupChatRecorder, pickChatRecorderMimeType, pushFreeChatMessage, showToast],
  );

  useEffect(() => {
    if (trainingPage !== "aiVoice") return;
    if (!latestChatMessage || latestChatMessage.role !== "ai") return;
    const msgId = Number(latestChatMessage.id ?? 0);
    if (!msgId || autoPlayedChatIdsRef.current.has(msgId)) return;
    autoPlayedChatIdsRef.current.add(msgId);
    void playChatMessage(latestChatMessage);
  }, [latestChatMessage, playChatMessage, trainingPage]);

  const submitTextChat = useCallback(() => {
    const content = customText.trim();
    if (!content || chatAiBusy || chatTranscribing) return;
    pushFreeChatMessage(content, "text");
    setCustomText("");
  }, [customText, chatAiBusy, chatTranscribing, pushFreeChatMessage]);

  const handlePressToTalkStart = useCallback(async () => {
    if (callOpen) return;
    if (chatAiBusy || chatTranscribing) {
      showToast("请等待当前处理完成");
      return;
    }
    if (recording) return;
    await beginPressHoldStyleRecorder("message");
  }, [beginPressHoldStyleRecorder, callOpen, chatAiBusy, chatTranscribing, recording, showToast]);

  const handlePressToTalkEnd = useCallback(() => {
    if (!recording) return;
    micStopReasonRef.current = "message";
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }
    cleanupChatRecorder();
    setRecording(false);
  }, [cleanupChatRecorder, recording]);

  const handleCallStartListening = useCallback(async () => {
    if (!callOpen) return;
    if (chatAiBusy || chatTranscribing) {
      showToast("请等待当前处理完成");
      return;
    }
    if (callRecording) return;
    await beginPressHoldStyleRecorder("call");
  }, [beginPressHoldStyleRecorder, callOpen, chatAiBusy, chatTranscribing, callRecording, showToast]);

  const handleCallPauseListening = useCallback(() => {
    if (!callOpen) return;
    if (chatAiBusy || chatTranscribing) return;
    if (!callRecording) return;
    micStopReasonRef.current = "callPause";
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }
    cleanupChatRecorder();
    setCallRecording(false);
    setCallPhoneMicPhase("paused");
  }, [callOpen, callRecording, chatAiBusy, chatTranscribing, cleanupChatRecorder]);

  const handleCallHangUp = useCallback(() => {
    micStopReasonRef.current = "hangup";
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      cleanupChatRecorder();
    }
    setRecording(false);
    setCallRecording(false);
    setCallPhoneMicPhase("idle");
    setCallOpen(false);
    setChatMode("消息模式");
  }, [cleanupChatRecorder]);

  const handleEnableCloudSync = useCallback(() => {
    if (!phoneAuthState) {
      setMinePage("login");
      return;
    }
    void (async () => {
      try {
        setCloudSyncBusy(true);
        if (phoneAuthState.mockMode) {
          const boot = await bootstrapCloudSync(freeChatInitialMessages, { phoneAuth: phoneAuthState, preferLocal: true });
          setCloudSyncProfile(boot.profile);
          setCloudSyncNotice(boot.pulledLearning ? "已从云端恢复学习进度" : "本地学习记录已同步到云端");
          setFavorites(loadFavorites());
          setMistakesState(loadMistakes());
          showToast("云端同步完成");
          return;
        }
        const boot = await bootstrapCloudSync(freeChatInitialMessages, { phoneAuth: phoneAuthState, preferLocal: true });
        setCloudSyncProfile(boot.profile);
        setCloudSyncNotice("本地学习记录已同步到云端");
        setFavorites(loadFavorites());
        setMistakesState(loadMistakes());
        showToast("云端同步完成");
      } catch {
        setCloudSyncNotice("云同步开启失败，请稍后重试");
        showToast("云同步开启失败");
      } finally {
        setCloudSyncBusy(false);
      }
    })();
  }, [phoneAuthState, showToast]);

  const handleSendPhoneCode = useCallback(() => {
    void (async () => {
      try {
        setCloudSyncBusy(true);
        const result = await sendPhoneCode(phoneInput);
        setPhoneAuthMode(result.mockMode ? "mock" : "sms");
        setCloudSyncNotice(result.message);
        showToast(result.mockMode ? "测试验证码已准备好" : "验证码已发送");
      } catch (error) {
        const message = error instanceof Error ? error.message : "验证码发送失败";
        setCloudSyncNotice(message);
        showToast(message);
      } finally {
        setCloudSyncBusy(false);
      }
    })();
  }, [phoneInput, showToast]);

  const handlePhoneLogin = useCallback(() => {
    void (async () => {
      try {
        setCloudSyncBusy(true);
        const authState = await verifyPhoneCode({
          phone: phoneInput,
          code: phoneCodeInput,
          nickname: phoneNicknameInput,
        });
        setPhoneAuthState(authState);
        setPhoneInput(authState.phone);
        setPhoneNicknameInput(authState.nickname);
        setPhoneAuthMode(authState.authMode);
        if (authState.mockMode) {
          const mockSession = buildMockCloudSession(authState);
          try {
            const boot = await bootstrapCloudSync(freeChatInitialMessages, { phoneAuth: authState, preferLocal: true });
            setCloudSyncProfile(boot.profile);
            setCloudSyncNotice(boot.pulledLearning ? "已从云端恢复学习进度" : "本地学习记录已同步到云端");
            setFavorites(loadFavorites());
            setMistakesState(loadMistakes());
            showToast("手机号登录成功（mock），数据已同步");
          } catch {
            setCloudSyncProfile({
              uid: mockSession.uid,
              isAnonymous: false,
              loginType: mockSession.loginType,
              enabled: false,
              phone: mockSession.phone,
              phoneMasked: mockSession.phoneMasked,
              nickname: mockSession.nickname,
              avatar: mockSession.avatar,
              authMode: "mock",
              lastSyncedAt: mockSession.lastLoginAt,
            });
            setCloudSyncNotice("云端暂时不可用，当前使用本地模式");
            showToast("手机号登录成功（mock），使用本地兜底");
          }
          return;
        }
        const preferLocal = typeof window !== "undefined"
          ? window.confirm("检测到当前设备可能已有本地学习记录。是否优先把本地记录同步到云端？")
          : true;
        const boot = await bootstrapCloudSync(freeChatInitialMessages, { phoneAuth: authState, preferLocal });
        setCloudSyncProfile(boot.profile);
        setCloudSyncNotice(preferLocal ? "本地学习记录已同步到云端" : boot.pulledLearning || boot.pulledChats ? "已载入云端学习记录" : "云同步已开启");
        setFavorites(loadFavorites());
        setMistakesState(loadMistakes());
        showToast(authState.mockMode ? "手机号登录成功（mock）" : "手机号登录成功");
      } catch (error) {
        const message = error instanceof Error ? error.message : "手机号登录失败";
        setCloudSyncNotice(message);
        showToast(message);
      } finally {
        setCloudSyncBusy(false);
      }
    })();
  }, [freeChatInitialMessages, phoneCodeInput, phoneInput, phoneNicknameInput, showToast]);

  const handleLogoutCloudUser = useCallback(() => {
    void (async () => {
      try {
        setCloudSyncBusy(true);
        clearPhoneAuth();
        setPhoneAuthState(null);
        setPhoneCodeInput("");
        setCloudSyncProfile(null);
        setCloudSyncNotice("当前使用本地模式");
        await signOutCloudSync().catch(() => undefined);
        showToast("已退出登录，继续使用本地学习");
      } finally {
        setCloudSyncBusy(false);
      }
    })();
  }, [showToast]);

  /** 进入收藏复习；startIndex 缺省则用单独持久化的收藏进度 */
  const enterFavoriteLearn = (startIndex) => {
    const items = getFavoriteLearnWordItems(favorites.wordFavorites, findPackById, favoriteWordPackFilter, favoriteWordSearch);
    if (items.length === 0) {
      showToast("暂无收藏可复习");
      return;
    }
    if (!isFavoriteLearnPack(selectedPack) && !isMistakeLearnPack(selectedPack)) {
      lastRealPackBeforeFavoriteRef.current = selectedPack;
    }
    let idx;
    if (typeof startIndex === "number" && !Number.isNaN(startIndex) && startIndex >= 0) {
      idx = Math.min(Math.max(0, startIndex), items.length - 1);
    } else {
      const saved = loadFavoriteWordLearning();
      idx = Math.min(Math.max(0, saved?.currentIndex ?? 0), items.length - 1);
    }
    setSelectedPack(FAVORITE_VIRTUAL_PACK);
    setWordPage("learn");
    setReviewOnly(false);
    setWordIndex(idx);
  };

  const enterMistakeLearn = (startIndex) => {
    const rows = filterMistakeRows(allMistakeRows, mistakeLibPackFilter, mistakeWordSearch);
    if (rows.length === 0) {
      showToast("暂无错题可复习");
      return;
    }
    if (!isFavoriteLearnPack(selectedPack) && !isMistakeLearnPack(selectedPack)) {
      lastRealPackBeforeFavoriteRef.current = selectedPack;
    }
    let idx;
    if (typeof startIndex === "number" && !Number.isNaN(startIndex) && startIndex >= 0) {
      idx = Math.min(Math.max(0, startIndex), rows.length - 1);
    } else {
      const saved = loadMistakeWordLearning();
      idx = Math.min(Math.max(0, saved?.currentIndex ?? 0), rows.length - 1);
    }
    setSelectedPack(MISTAKE_VIRTUAL_PACK);
    setWordPage("learn");
    setReviewOnly(false);
    setWordIndex(idx);
  };

  const goTask = (target) => {
    if (target === "words") {
      setActiveTab("words");
      setWordPage("learn");
      const pos = pickWordResume();
      setSelectedPack(pos.pack);
      setWordIndex(pos.idx);
      addRecent({ id: "entry-words", kind: "training", label: "单词学习", trainingTarget: "words" });
    }
    if (target === "shadow") {
      setActiveTab("training");
      setTrainingPage("shadow");
      setShadowPage("overview");
      addRecent({ id: "entry-shadow", kind: "training", label: "口语跟读训练", trainingTarget: "shadow" });
    }
    if (target === "aiVoice") {
      setActiveTab("training");
      setTrainingPage("aiVoice");
      addRecent({ id: "entry-aivoice", kind: "training", label: "AI语音对话", trainingTarget: "aiVoice" });
    }
  };

  const continueWordFromSaved = () => {
    setActiveTab("words");
    setWordPage("learn");
    const pos = pickWordResume();
    setSelectedPack(pos.pack);
    setWordIndex(pos.idx);
    addRecent({ id: "entry-words", kind: "training", label: "单词学习", trainingTarget: "words" });
  };

  const startTodayLearning = () => {
    const nextTask = todayTasks.find((task) => !task.done) || todayTasks[0];
    goTask(nextTask.target);
  };

  function renderHome() {
    const pos = v2Hydrated ? pickWordResume() : getSeedWordResume();
    const resumeTitleLine = `${pos.pack.name} · 第${pos.idx + 1}词 ${pos.resumeLemma ?? pos.src[pos.idx]?.word ?? ""}`;
    const resumeProgressVal = pos.src.length ? Math.min(100, ((pos.idx + 1) / pos.src.length) * 100) : 0;
    const doneCount = todayTasks.filter((item) => item.done).length;
    return (
      <>
        <PageHeader title="下午好，今天稳步积累就好" desc="系统已整理好最短学习路径，点一次就能开始。" />
        <Surface className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] font-bold text-[#8A6324]">今日进度</div>
            <div className="text-[12px] font-bold text-[#8A6324]">{doneCount}/{todayTasks.length}</div>
          </div>
          <div className="mt-2"><Progress value={(doneCount / todayTasks.length) * 100} /></div>
          <div className="mt-5 text-[12px] font-bold text-[#8A6324]">继续上次学习</div>
          <h2 className="mt-2 text-[22px] font-bold leading-tight text-[#2C241C]">{resumeTitleLine}</h2>
          <div className="mt-3"><Progress value={resumeProgressVal} /></div>
          <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">今天建议：复习 8 个词 → 完成 1 轮 AI 语音对话。</p>
          <button type="button" onClick={continueWordFromSaved} className="mt-4 w-full rounded-[16px] border border-[#E6D8BF] bg-[#FFF8EA] py-3 text-[14px] font-bold text-[#8A6324] active:scale-[0.98]">继续上次学习</button>
          <button type="button" onClick={startTodayLearning} className="mt-2 w-full rounded-[16px] bg-[#3A2A1A] py-3 text-[14px] font-bold text-white active:scale-[0.98]">开始今日学习</button>
        </Surface>
        <div className="mt-4 space-y-3">
          {todayTasks.map((item) => (
            <button key={item.title} onClick={() => goTask(item.target)} className={`flex w-full items-center gap-3 rounded-[18px] border border-[#E6D8BF] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] active:scale-[0.98] ${item.done ? "bg-[#F7EEDB] opacity-75" : "bg-[#FFF8EA]"}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${item.done ? "bg-[#D8B65E] text-[#2B2118]" : "bg-white text-[#8A6324]"}`}>{item.done ? "✓" : "○"}</div>
              <div className="min-w-0 flex-1">
                <div className={`text-[15px] font-bold ${item.done ? "text-[#8B7B67]" : "text-[#2C241C]"}`}>{item.title}</div>
                <div className="mt-1 text-[12px] text-[#7A6B57]">{item.desc}</div>
              </div>
              <div className="text-[#8A6324]">›</div>
            </button>
          ))}
        </div>
      </>
    );
  }

  const openPack = (pack) => {
    lastRealPackBeforeFavoriteRef.current = pack;
    setSelectedPack(pack);
    setWordPage("learn");
    setWordIndex(0);
    // 如果是真实词库，异步加载
    const bid = LABEL_TO_BANK_ID[pack.name];
    if (bid && !bankData[bid]) {
      setBankLoading(true);
      setBankError("");
      loadWordBank(bid).then((state) => {
        setBankLoading(false);
        if (state.status === "loaded") {
          setBankData((prev) => ({ ...prev, [bid]: state.data }));
        } else {
          setBankError(state.error);
        }
      });
    }
  };

  /** 当前词包在 App 内可学的词条数 */
  const wordCountForPack = (pack) => {
    if (!pack) return 0;
    if (isFavoriteLearnPack(pack)) return favoriteLearnWordItems.length;
    if (isMistakeLearnPack(pack)) return mistakeLearnWordItems.length;
    if (pack.id === "personal-language-parse") return personalPackWords.length;
    // 真实词库优先从 manifest 获取
    const bid = LABEL_TO_BANK_ID[pack.name];
    if (bid && bankManifest?.[bid]) {
      return bankManifest[bid].count;
    }
    // 从已加载的 bankData 获取
    if (bid && bankData[bid]) {
      return bankData[bid].length;
    }
    return sampleWords.length;
  };

  function renderWords() {
    const favoriteMode = isFavoriteLearnPack(selectedPack);
    const mistakeMode = isMistakeLearnPack(selectedPack);
    const bid = LABEL_TO_BANK_ID[selectedPack.name];
    const isRealBank = !!bid;
    const realBankWords = isRealBank ? bankData[bid] : null;
    const wordSource = learnBaseWordSource;

    const exitLearnToWordLibrary = () => {
      setWordPage("list");
    };

    const exitFavoriteLearnToList = () => {
      setWordPage("favorites");
      setSelectedPack(lastRealPackBeforeFavoriteRef.current);
    };

    const exitMistakeLearnToList = () => {
      setWordPage("mistakes");
      setSelectedPack(lastRealPackBeforeFavoriteRef.current);
    };

    const learnReviewBack = () => {
      if (favoriteMode) exitFavoriteLearnToList();
      else if (mistakeMode) exitMistakeLearnToList();
      else exitLearnToWordLibrary();
    };

    if (wordPage === "unitFilter" && activeBankId && bankGroupsDoc?.groups?.length && bankGroupsDoc.bankId === activeBankId) {
      const applyUnitFilterAndLearn = (ids: string[]) => {
        if (ids.length === 0) return;
        patchUnitGroupForBank(activeBankId, { applied: ids, pick: ids });
        setWordIndex(0);
        setWordPage("learn");
        showToast(`已筛选 ${countWordsInGroups(bankGroupsDoc, ids)} 词`);
      };

      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <WordUnitFilterPanel
            groups={bankGroupsDoc.groups}
            bankLabel={bankDisplayLabel(activeBankId)}
            selectedIds={unitGroupPickIds}
            onCheckboxToggle={(id) => {
              const next = unitGroupPickIds.includes(id)
                ? unitGroupPickIds.filter((x) => x !== id)
                : [...unitGroupPickIds, id];
              patchUnitGroupForBank(activeBankId, { pick: next });
            }}
            onCardClick={(id) => {
              const pickCount = unitGroupPickIds.length;
              const onlyThis = pickCount === 1 && unitGroupPickIds[0] === id;
              if (pickCount >= 2) {
                patchUnitGroupForBank(activeBankId, { pick: [id] });
                return;
              }
              if (pickCount === 0 || !onlyThis) {
                patchUnitGroupForBank(activeBankId, { pick: [id] });
              }
              applyUnitFilterAndLearn([id]);
            }}
            onSelectAll={() => patchUnitGroupForBank(activeBankId, { pick: bankGroupsDoc.groups.map((g) => g.id) })}
            onClearAll={() => patchUnitGroupForBank(activeBankId, { pick: [] })}
            onBack={() => setWordPage("learn")}
            onConfirm={() => applyUnitFilterAndLearn(unitGroupPickIds)}
          />
        </div>
      );
    }

    if (wordPage === "learn") {
      // 加载真实词库中
      if (!favoriteMode && !mistakeMode && selectedPack.id !== "personal-language-parse" && isRealBank && !realBankWords) {
        if (bankLoading) {
          return (
            <>
              <PageHeader title={selectedPack.name} desc="加载中..." back onBack={() => { setWordPage("list"); }} />
              <Surface className="p-8 text-center">
                <div className="animate-pulse text-[16px] font-bold text-[#8A6324]">正在加载词库...</div>
                <p className="mt-3 text-[13px] text-[#998B78]">{selectedPack.name} · {bankManifest?.[bid]?.count ?? "..."} 词</p>
              </Surface>
            </>
          );
        }
        if (bankError) {
          return (
            <>
              <PageHeader title={selectedPack.name} desc="加载失败" back onBack={() => { setWordPage("list"); }} />
              <Surface className="p-8 text-center">
                <div className="text-[16px] font-bold text-red-500">加载失败</div>
                <p className="mt-3 text-[13px] text-[#998B78]">{bankError}</p>
                <p className="mt-2 text-[12px] text-[#998B78]">已切换到备用词表，功能不受影响</p>
              </Surface>
            </>
          );
        }
      }
      if (favoriteMode && wordSource.length === 0) {
        return (
          <>
            <PageHeader title="我的收藏单词" desc="收藏复习" back onBack={exitFavoriteLearnToList} />
            <Surface className="p-6 text-center">
              <div className="text-[20px] font-bold text-[#2C241C]">收藏词已清空</div>
              <p className="mt-3 text-[13px] leading-6 text-[#6B5B49]">收藏词已清空，先去词包里收藏一些常用词。</p>
              <button type="button" onClick={exitFavoriteLearnToList} className="mt-5 w-full rounded-[16px] bg-[#3A2A1A] py-3 text-[14px] font-bold text-white active:scale-[0.98]">
                返回收藏列表
              </button>
            </Surface>
          </>
        );
      }
      if (mistakeMode && wordSource.length === 0) {
        return (
          <>
            <PageHeader title="错题库" desc="错题复习" back onBack={exitMistakeLearnToList} />
            <Surface className="p-6 text-center">
              <div className="text-[20px] font-bold text-[#2C241C]">当前没有可复习的错题</div>
              <p className="mt-3 text-[13px] leading-6 text-[#6B5B49]">请调整筛选或返回错题库列表。</p>
              <button type="button" onClick={exitMistakeLearnToList} className="mt-5 w-full rounded-[16px] bg-[#3A2A1A] py-3 text-[14px] font-bold text-white active:scale-[0.98]">
                返回错题库
              </button>
            </Surface>
          </>
        );
      }
      if (reviewOnly && learnDisplayWords.length === 0) {
        return (
          <>
            <PageHeader title={favoriteMode ? "我的收藏单词" : mistakeMode ? "错题库" : selectedPack.name} desc="当前没有待复习内容。" back onBack={learnReviewBack} />
            <Surface className="p-6 text-center">
              <div className="text-[20px] font-bold text-[#2C241C]">暂无待复习生词</div>
              <p className="mt-3 text-[13px] leading-6 text-[#6B5B49]">这个词库目前没有需要复习的词。你可关闭「复习模式」继续按当前顺序学习。</p>
              <button type="button" onClick={() => { setReviewOnly(false); setWordIndex(0); }} className="mt-5 w-full rounded-[16px] bg-[#3A2A1A] py-3 text-[14px] font-bold text-white active:scale-[0.98]">关闭复习模式</button>
            </Surface>
          </>
        );
      }
      if (!favoriteMode && !mistakeMode && unitGroupAppliedIds.length > 0 && learnDisplayWords.length === 0) {
        return (
          <>
            <PageHeader title={selectedPack.name} desc="当前单元筛选无匹配词条。" back onBack={learnReviewBack} />
            <Surface className="p-6 text-center">
              <div className="text-[20px] font-bold text-[#2C241C]">所选单元暂无词条</div>
              <p className="mt-3 text-[13px] leading-6 text-[#6B5B49]">请调整单元选择，或清除筛选继续学习全库。</p>
              <button type="button" onClick={() => { patchUnitGroupForBank(activeBankId, { pick: [], applied: [] }); setWordIndex(0); }} className="mt-5 w-full rounded-[16px] bg-[#3A2A1A] py-3 text-[14px] font-bold text-white active:scale-[0.98]">清除单元筛选</button>
            </Surface>
          </>
        );
      }
      const safeIdx = Math.min(Math.max(0, wordIndex), Math.max(0, learnDisplayWords.length - 1));
      const w = learnDisplayWords[safeIdx];
      if (!w) return null;
      const denom = learnDisplayWords.length;
      const numer = safeIdx + 1;
      const wkey = makeWordKey(selectedPack.id, w.word);
      const favWord = favoriteMode ? true : isWordFavoritedFromPack(favorites.wordFavorites, selectedPack.id, w.word);
      const lemmaKey = w.word.toLowerCase();
      const mistakeRow = mistakeMode ? mistakeLearnRows.find((r) => r.item.word === w.word) ?? null : null;
      const sourceLineLabel = mistakeMode ? "出错类别" : favoriteMode ? "收藏来源" : "学习来源";
      const sourceLineValue = mistakeMode
        ? mistakeRow?.mistakeSourcePacks?.length
          ? mistakeRow.mistakeSourcePacks.join(" / ")
          : "未记录来源"
        : favoriteMode
          ? getFavoriteSourceLineForLemma(favorites, findPackById, lemmaKey)
          : selectedPack.name;
      const orderLabel = learnOrderMode === "sequential" ? "正序" : learnOrderMode === "shuffle" ? "乱序" : "核心优先";
      const favChipLabel = getFavoriteSourcePillOptions().find((o) => o.value === favoriteWordPackFilter)?.label ?? "全部收藏";
      const misChipLabel = mistakeLibPillOptions.find((o) => o.value === mistakeLibPackFilter)?.label ?? "全部错题";
      const scopeChip = favoriteMode
        ? `收藏复习 · ${favChipLabel}`
        : mistakeMode
          ? `错题复习 · ${misChipLabel}`
          : `${selectedPack.name} · ${reviewOnly ? "复习模式" : orderLabel}`;
      const learnBackLabel = favoriteMode ? "收藏单词" : mistakeMode ? "错题库" : "单词库";
      const packsForCurrentMistake = mistakeRow?.mistakeSourcePacks ?? [];
      const alsoInList = mistakeMode ? alsoInDisplayNames(w, packsForCurrentMistake) : allPackNamesContainingLemma(lemmaKey);
      const misCount = mistakeOccurrenceCount(lemmaKey);

      return (
        <div className="-mx-1 flex min-h-0 flex-col pb-[72px] md:pb-[88px]">
          <button type="button" onClick={learnReviewBack} className="mb-3 text-left text-[14px] font-bold text-[#8A6324] active:opacity-80">
            ‹ 返回{learnBackLabel}
          </button>

          <div className="-mx-1 mb-3 overflow-x-auto px-1 pb-1 md:mb-4">
            <div className="flex min-w-0 gap-1.5 md:gap-2">
            <span className="shrink-0 rounded-full bg-[#3A2A1A] px-3 py-2 text-[11px] font-bold whitespace-nowrap text-white md:px-4 md:text-[12px]">
              标准发音
            </span>
            {(
              [
                ["sequential", "正序"],
                ["shuffle", "乱序"],
                ["coreFirst", "核心优先"],
              ]
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setLearnOrderMode(mode);
                  setWordIndex(0);
                  if (mode === "shuffle") setShuffleSeed((Date.now() >>> 0) || 1);
                }}
                className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-bold whitespace-nowrap active:scale-95 md:px-4 md:text-[12px] ${learnOrderMode === mode ? "bg-[#3A2A1A] text-white" : "bg-[#FFF8EA] text-[#6B5B49] ring-1 ring-[#E6D8BF]"}`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setReviewOnly((v) => !v);
                setWordIndex(0);
              }}
              className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-bold whitespace-nowrap active:scale-95 md:px-4 md:text-[12px] ${reviewOnly ? "bg-[#3A2A1A] text-white" : "bg-[#FFF8EA] text-[#6B5B49] ring-1 ring-[#E6D8BF]"}`}
            >
              {reviewOnly ? "复习模式" : "全部词条"}
            </button>
            {!favoriteMode && !mistakeMode && activeBankId && bankGroupsDoc?.groups?.length && bankGroupsDoc.bankId === activeBankId ? (
              <button
                type="button"
                onClick={() => {
                  patchUnitGroupForBank(activeBankId, {
                    pick: unitGroupAppliedIds.length ? unitGroupAppliedIds : unitGroupPickIds,
                  });
                  setWordPage("unitFilter");
                }}
                className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-bold whitespace-nowrap active:scale-95 md:px-4 md:text-[12px] ${
                  unitGroupAppliedIds.length
                    ? "bg-[#3A2A1A] text-white"
                    : "bg-[#FFF8EA] text-[#6B5B49] ring-1 ring-[#E6D8BF]"
                }`}
              >
                {unitGroupAppliedIds.length ? `单元·${countWordsInGroups(bankGroupsDoc, unitGroupAppliedIds)}词` : "分类学习"}
              </button>
            ) : null}
            </div>
          </div>

          <section className="flex min-h-0 flex-1 flex-col rounded-[24px] border border-[#E6D8BF] bg-[#FFF8EA] p-3 shadow-sm md:rounded-[30px] md:p-4">
            <div className="rounded-[18px] border border-[#E6D8BF] bg-white/90 p-3 shadow-[0_4px_16px_rgba(58,42,26,0.05)] md:rounded-[22px]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold tracking-[0.08em] text-[#8A6324]">当前词库</p>
                  <h3 className="mt-1 truncate text-[16px] font-bold text-[#2C241C] md:text-[18px]" title={selectedPack.name}>{selectedPack.name}</h3>
                </div>
                <span className="shrink-0 rounded-full bg-[#F7EEDB] px-2.5 py-1 text-[10px] font-bold text-[#8A6324] md:px-3 md:py-1.5 md:text-[11px]">
                  {numer}/{denom}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5 md:mt-3 md:gap-2">
                <span className="rounded-full bg-[#FBF2DA] px-2.5 py-1 text-[10px] font-bold text-[#8A6324] md:px-3 md:text-[11px]">{reviewOnly ? "复习模式" : orderLabel}</span>
                <span className="max-w-full truncate rounded-full bg-[#FFF8EA] px-2.5 py-1 text-[10px] font-bold text-[#6B5B49] ring-1 ring-[#E6D8BF] md:px-3 md:text-[11px]" title={`${sourceLineLabel}：${sourceLineValue}`}>
                  {sourceLineLabel}：{sourceLineValue}
                </span>
              </div>
            </div>

            <div className="mt-3 shrink-0 rounded-[20px] bg-white/95 p-3 text-center shadow-[0_6px_18px_rgba(58,42,26,0.06)] md:mt-4 md:rounded-[24px] md:p-4">
              <p className="text-[11px] font-bold tracking-[0.08em] text-[#998B78]">当前单词</p>
              <h2 className="mt-1.5 break-words text-[44px] font-bold leading-none tracking-[-0.03em] text-[#2C241C] sm:text-[44px] md:mt-2 md:text-[42px] md:leading-tight">{w.word}</h2>
              <div className="mt-2.5 rounded-[16px] bg-[#FFF8EA] px-3 py-2.5 md:mt-3 md:rounded-[18px] md:py-3">
                <p className="text-[11px] font-bold tracking-[0.08em] text-[#998B78]">音标与发音</p>
                <p className="mt-1 text-[15px] font-medium tracking-[0.02em] text-[#8A6324] md:text-[16px]">{w.phonetic}</p>
              </div>
              <div className="mt-2.5 flex flex-wrap justify-center gap-1.5 md:mt-3 md:gap-2">
                <span className="rounded-full bg-[#F7EEDB] px-2.5 py-1 text-[10px] font-bold text-[#8A6324] md:px-3 md:text-[11px]">词性：{w.pos || "待补"}</span>
                <span className="rounded-full bg-[#F7EEDB] px-2.5 py-1 text-[10px] font-bold text-[#8A6324] md:px-3 md:text-[11px]">学习来源：{selectedPack.name}</span>
              </div>
            </div>

            <div className="mt-3 grid shrink-0 grid-cols-2 gap-2 md:mt-4">
              <button
                type="button"
                onClick={() => {
                  if (!speakText(w.word, { scope: "learnWord" })) showToast("当前环境不支持朗读");
                }}
                className="rounded-[16px] bg-white px-3 py-2.5 text-[12px] font-bold text-[#8A6324] ring-1 ring-[#E6D8BF] active:scale-95 md:rounded-[18px] md:py-3"
              >
                🔊 播放发音
              </button>
              {favoriteMode ? (
                <button
                  type="button"
                  onClick={() => {
                    const wid = makeWordId(w.word);
                    setFavorites((f) => ({
                      ...f,
                      wordFavorites: f.wordFavorites.filter((e) => e.wordId !== wid),
                    }));
                    showToast("已取消收藏");
                  }}
                  className="rounded-[16px] bg-[#3A2A1A] px-3 py-2.5 text-[12px] font-bold text-white active:scale-95 md:rounded-[18px] md:py-3"
                >
                  ★ 已收藏
                </button>
              ) : mistakeMode ? (
                <button
                  type="button"
                  onClick={() => setWordLearnDetailOpen(true)}
                  className="rounded-[16px] bg-[#3A2A1A] px-3 py-2.5 text-[12px] font-bold text-white active:scale-95 md:rounded-[18px] md:py-3"
                >
                  错题 {misCount} 次
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const wid = makeWordId(w.word);
                    const h = isWordFavoritedFromPack(favorites.wordFavorites, selectedPack.id, w.word);
                    const ctx = findPackContext(selectedPack.id);
                    const groupId = ctx?.savedFromGroupId ?? "";
                    const groupName = ctx?.savedFromGroupName ?? "";
                    const packId = ctx?.pack?.id ?? selectedPack.id;
                    const packName = ctx?.pack?.name ?? selectedPack.name;
                    setFavorites((f) => {
                      if (h) {
                        return {
                          ...f,
                          wordFavorites: f.wordFavorites.filter((e) => !(e.savedFromPackId === selectedPack.id && e.wordId === wid)),
                        };
                      }
                      return {
                        ...f,
                        wordFavorites: [
                          ...f.wordFavorites,
                          {
                            wordId: wid,
                            word: w.word,
                            savedFromGroupId: groupId,
                            savedFromGroupName: groupName,
                            savedFromPackId: packId,
                            savedFromPackName: packName,
                            savedAt: Date.now(),
                          },
                        ],
                      };
                    });
                    showToast(h ? "已取消收藏" : "已收藏单词");
                  }}
                  className={`rounded-[16px] px-3 py-2.5 text-[12px] font-bold active:scale-95 md:rounded-[18px] md:py-3 ${favWord ? "bg-[#3A2A1A] text-white" : "bg-white text-[#8A6324] ring-1 ring-[#E6D8BF]"}`}
                >
                  {favWord ? "★ 已收藏" : "☆ 收藏"}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setLoopPlay(!loopPlay);
                showToast(loopPlay ? "已关闭循环播放" : "已开启循环播放");
              }}
              className={`mt-2 inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full px-3 py-1.5 text-[10px] font-bold active:scale-95 md:text-[11px] ${
                loopPlay ? "bg-[#F7EEDB] text-[#3A2A1A] ring-1 ring-[#D8B65E]" : "bg-transparent text-[#8A6324]"
              }`}
            >
              <span>{loopPlay ? "●" : "○"}</span>
              <span>循环播放</span>
            </button>

            <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden md:mt-4">
              <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain pr-0.5 pb-3 md:space-y-3">
                <div className="rounded-[18px] border border-[#EBDCC2] bg-white/95 p-3 shadow-[0_6px_18px_rgba(58,42,26,0.05)] md:rounded-[22px] md:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-bold tracking-[0.08em] text-[#998B78]">核心释义</p>
                    <span className="rounded-full bg-[#F7EEDB] px-2 py-0.5 text-[11px] font-bold text-[#8A6324]">{w.pos}</span>
                  </div>
                  <p className="mt-1.5 text-[16px] font-bold leading-snug text-[#2C241C] md:mt-2 md:text-[17px]">{w.cn}</p>
                </div>

                <div className="rounded-[20px] border border-[#EBDCC2] bg-[#FFFDF8] p-3 shadow-[0_6px_18px_rgba(58,42,26,0.05)] md:rounded-[24px] md:p-4">
                  <div className="mb-2.5 flex items-center justify-between gap-3 md:mb-3">
                    <div>
                      <div className="text-[12px] font-bold tracking-[0.08em] text-[#998B78]">英文例句</div>
                      <div className="mt-1 text-[10px] text-[#B09A7C] md:text-[11px]">目标词会自动高亮</div>
                    </div>
                    {w.example?.trim() ? (
                      <button
                        type="button"
                        onClick={() => {
                          learnExampleGenRef.current += 1;
                          const gen = learnExampleGenRef.current;
                          setLearnExamplePhase("preparing");
                          void (async () => {
                            const r = await queueLearnExampleQwenSpeech(w.example, voice, {
                              onPlaybackStarted() {
                                if (learnExampleGenRef.current === gen) setLearnExamplePhase("playing");
                              },
                              onPlaybackEnded() {
                                if (learnExampleGenRef.current === gen) setLearnExamplePhase("idle");
                              },
                            });
                            if (learnExampleGenRef.current !== gen) return;
                            if (!r.ok) {
                              setLearnExamplePhase("idle");
                              showToast("例句播放失败，请重试");
                            }
                          })();
                        }}
                        className={`flex shrink-0 items-center justify-center rounded-full border border-[#E6D8BF] bg-[#FFF8EA] font-bold leading-none text-[#8A6324] active:scale-95 ${
                          learnExamplePhase === "idle"
                            ? "h-8 min-w-[3rem] px-3 text-[11px] md:h-9 md:min-w-[3.25rem] md:text-[12px]"
                            : "h-8 min-w-[5rem] px-3 text-[10px] md:h-9 md:min-w-[5.75rem]"
                        }`}
                      >
                        {learnExamplePhase === "idle"
                          ? "🔊 播放"
                          : learnExamplePhase === "preparing"
                            ? "准备中..."
                            : "播放中..."}
                      </button>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="rounded-[16px] bg-[#FFF8EA] px-3 py-2.5 text-[15px] font-semibold leading-7 text-[#2C241C] md:rounded-[18px] md:px-4 md:py-3 md:text-[16px] md:leading-8">
                      <div className="min-w-0 break-words">
                        <HighlightedExample sentence={w.example} word={w.word} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-[12px] font-bold tracking-[0.08em] text-[#998B78]">中文翻译</div>
                      {w.exampleCn?.trim() ? (
                        <p className="mt-1.5 rounded-[16px] border border-[#F1E7D5] bg-white px-3 py-2.5 text-[13px] leading-6 text-[#7E6C57] md:mt-2 md:rounded-[18px] md:px-4 md:py-3 md:text-[14px] md:leading-7">{w.exampleCn}</p>
                      ) : (
                        <p className="mt-1.5 rounded-[16px] border border-dashed border-[#E6D8BF] bg-white/80 px-3 py-2.5 text-[12px] leading-relaxed text-[#8a765f] md:mt-2 md:rounded-[18px] md:px-4 md:py-3">例句翻译待补</p>
                      )}
                    </div>
                  </div>
                </div>

                {w.collocations && w.collocations.length > 0 ? (
                  <div className="rounded-[18px] bg-white/90 p-3 md:rounded-[20px]">
                    <div className="mb-2 text-[12px] font-bold text-[#998B78]">常见搭配</div>
                    <div className="flex flex-wrap gap-1.5">
                      {w.collocations.map((c) => (
                        <span key={c} className="rounded-full bg-[#FBF2DA] px-2.5 py-1 text-[11px] font-bold text-[#8A6324] md:px-3 md:text-[12px]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {w.confusables && w.confusables.length > 0 ? (
                  <div className="rounded-[18px] bg-white/90 p-3 md:rounded-[20px]">
                    <div className="mb-2 text-[12px] font-bold text-[#998B78]">易混词</div>
                    <div className="space-y-2">
                      {w.confusables.map((c) => (
                        <div key={c.word} className="flex items-start gap-2">
                          <span className="shrink-0 rounded-full bg-[#FBF2DA] px-2 py-0.5 text-[11px] font-bold text-[#8A6324] md:text-[12px]">
                            {c.word}
                          </span>
                          <p className="min-w-0 flex-1 text-[11px] leading-5 text-[#6B5B49] md:text-[12px] md:leading-relaxed">{c.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {w.pitfalls && w.pitfalls.length > 0 ? (
                  <div className="rounded-[18px] bg-white/90 p-3 md:rounded-[20px]">
                    <div className="mb-2 text-[12px] font-bold text-[#998B78]">常错点</div>
                    <ul className="space-y-1.5">
                      {w.pitfalls.map((p) => (
                        <li key={p} className="flex gap-2 text-[11px] leading-5 text-[#6B5B49] md:text-[12px] md:leading-relaxed">
                          <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#D8B65E]" />
                          <span className="min-w-0 flex-1">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setWordLearnDetailOpen((v) => !v)}
                  className="w-full rounded-[16px] bg-[#F7EEDB] px-3 py-2.5 text-left text-[12px] font-bold text-[#6B5B49] active:scale-[0.99] md:rounded-[18px]"
                >
                  {wordLearnDetailOpen ? "收起详情" : mistakeMode ? "展开来源详情" : "展开来源 / 错误原因"}
                </button>

                {wordLearnDetailOpen ? (
                  <div className="rounded-[18px] bg-white/90 p-3 text-[12px] leading-6 md:rounded-[20px] md:text-[13px] md:leading-relaxed">
                    <p className="font-bold text-[#2C241C]">{mistakeMode ? "错题备注" : favoriteMode ? "复习备注" : "学习来源"}</p>
                    <p className="mt-1 text-[#6B5B49]">
                      {mistakeMode ? (
                        <>
                          {mistakeRow?.reason ?? ""}
                          {mistakeRow?.category ? (
                            <span className="mt-2 block text-[12px] text-[#998B78]">易错类型：{mistakeRow.category}</span>
                          ) : null}
                        </>
                      ) : favoriteMode ? (
                        "已加入收藏，适合集中复习。"
                      ) : (
                        `当前词包：${selectedPack.name}`
                      )}
                    </p>
                    {alsoInList.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-[#FBF2DA] px-2 py-0.5 text-[11px] font-bold text-[#8A6324]">也属于</span>
                        {alsoInList.slice(0, 12).map((pack) => (
                          <span key={pack} className="rounded-full bg-[#FFF8EA] px-2 py-0.5 text-[11px] text-[#6B5B49] ring-1 ring-[#E6D8BF]">
                            {pack}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <div
            className="sticky bottom-0 z-10 mt-3 -mx-3 -mb-3 grid shrink-0 grid-cols-3 gap-2 border-t border-[#E6D8BF]/50 bg-[#F1E3CF]/98 px-3 pt-2.5 shadow-[0_-8px_20px_rgba(58,42,26,0.08)] backdrop-blur-sm md:mt-4 md:-mx-4 md:-mb-4 md:px-4 md:pt-3"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}
          >
            <button
              type="button"
              onClick={() => {
                setWordIndex((i) => Math.max(0, i - 1));
              }}
              className="min-h-[42px] rounded-[16px] bg-white py-2.5 text-[13px] font-bold text-[#8A6324] ring-1 ring-[#E6D8BF] active:scale-[0.98] md:min-h-[48px] md:rounded-[18px] md:py-3 md:text-[14px]"
            >
              上一词
            </button>
            <button
              type="button"
              onClick={() => {
                setMasteredWordKeys((prev) => (prev.includes(wkey) ? prev : [...prev, wkey]));
                showToast("已标记掌握");
              }}
              className="min-h-[42px] rounded-[16px] bg-[#3A2A1A] py-2.5 text-[13px] font-bold text-white active:scale-[0.98] md:min-h-[48px] md:rounded-[18px] md:py-3 md:text-[14px]"
            >
              掌握
            </button>
            <button
              type="button"
              onClick={() => {
                setWordIndex((i) => Math.min(Math.max(0, learnDisplayWords.length - 1), i + 1));
              }}
              className="min-h-[42px] rounded-[16px] bg-white py-2.5 text-[13px] font-bold text-[#8A6324] ring-1 ring-[#E6D8BF] active:scale-[0.98] md:min-h-[48px] md:rounded-[18px] md:py-3 md:text-[14px]"
            >
              下一词
            </button>
          </div>
        </div>
      );
    }

    if (wordPage === "favorites") {
      const allFavRows = buildAllFavoriteRows(favorites.wordFavorites, findPackById);
      const filteredByPack = filterFavoriteRowsByPack(allFavRows, favoriteWordPackFilter);
      const favRows = filterFavoriteRowsBySearch(filteredByPack, favoriteWordSearch);
      const favoriteSourcePills = getFavoriteSourcePillOptions();
      const hasStoredFavorites = (favorites.wordFavorites || []).length > 0;
      const filterTight = favoriteWordPackFilter !== "all" || !!favoriteWordSearch.trim();
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setWordPage("list");
              setFavoriteWordPackFilter("all");
              setFavoriteWordSearch("");
            }}
            className="mb-4 text-left text-[14px] font-bold text-[#8A6324] active:opacity-80"
          >
            ‹ 返回单词库
          </button>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[22px] font-bold leading-tight text-[#2C241C]">我的收藏单词</h2>
              <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">同一单词只显示一次，保留收藏来源。</p>
            </div>
            <button type="button" onClick={() => enterFavoriteLearn()} className="shrink-0 rounded-[14px] bg-[#3A2A1A] px-3 py-2 text-[11px] font-bold text-white active:scale-95">
              复习收藏
            </button>
          </div>

          <Surface className="mb-4 p-3 shadow-sm">
            <input
              type="search"
              enterKeyHint="search"
              value={favoriteWordSearch}
              onChange={(e) => setFavoriteWordSearch(e.target.value)}
              placeholder="搜单词 / 释义 / 来源词库"
              className="w-full rounded-[14px] border border-[#E6D8BF] bg-white/90 px-3 py-2.5 text-[14px] text-[#2C241C] placeholder:text-[#998B78] outline-none focus:border-[#8A6324]"
              autoComplete="off"
            />
          </Surface>

          <div className="mb-4 overflow-x-auto pb-1 -mx-1 px-1">
            <div className="flex min-w-0 items-center gap-2">
              {favoriteSourcePills.map((opt, i) => (
                <button
                  key={`${opt.value}-${i}`}
                  type="button"
                  onClick={() => setFavoriteWordPackFilter(opt.value)}
                  className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold whitespace-nowrap ${
                    favoriteWordPackFilter === opt.value
                      ? "bg-[#3A2A1A] text-white"
                      : "bg-[#FFF8EA] text-[#6B5B49]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {favRows.length === 0 ? (
            <Surface className="p-5 text-center shadow-sm">
              <div className="text-[15px] font-bold text-[#2C241C]">
                {!hasStoredFavorites
                  ? "暂无收藏"
                  : filterTight
                    ? "没有匹配的收藏"
                    : allFavRows.length === 0
                      ? "收藏词条暂无法展示"
                      : "暂无收藏"}
              </div>
              <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">
                {!hasStoredFavorites
                  ? "还没有收藏单词，先去词包里收藏一些常用词。"
                  : filterTight
                    ? "可清空搜索框或切换到「全部收藏」，也可换一个来源筛选。"
                    : allFavRows.length === 0
                      ? "本地收藏记录仍在，但词条未能匹配当前词表数据。"
                      : "请切换上方筛选，或返回单词库继续学习。"}
              </p>
            </Surface>
          ) : (
            <div className="space-y-3">
              {favRows.map((row) => {
                const savedAtStr = formatFavoriteSavedAt(row.primary.savedAt);
                return (
                  <article
                    key={row.wordId}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        const i = favRows.findIndex((r) => r.wordId === row.wordId);
                        enterFavoriteLearn(i >= 0 ? i : 0);
                      }
                    }}
                    onClick={() => {
                      const i = favRows.findIndex((r) => r.wordId === row.wordId);
                      enterFavoriteLearn(i >= 0 ? i : 0);
                    }}
                    className="cursor-pointer rounded-[22px] border border-[#E6D8BF] bg-[#FFF8EA] p-4 shadow-[0_4px_16px_rgba(58,42,26,0.05)] transition active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[18px] font-bold text-[#2C241C]">{row.item.word}</h3>
                          <span className="text-[12px] text-[#8A6324]">{row.item.phonetic}</span>
                        </div>
                        <p className="mt-1 text-[14px] font-medium text-[#5f4b38]">{row.item.cn}</p>
                      </div>
                      <span className="shrink-0 text-[11px] font-bold text-[#8A6324]">学习 ›</span>
                    </div>
                    {row.item.example?.trim() ? (
                      <p className="mt-3 rounded-[16px] bg-white/70 px-3 py-2 text-[12px] leading-relaxed text-[#6B5B49]">{row.item.example}</p>
                    ) : null}
                    <div className="mt-3 rounded-[16px] bg-[#F7EEDB] px-3 py-2 text-[12px] text-[#6B5B49]">
                      收藏来源：<span className="font-bold text-[#2C241C]">{row.displaySource}</span>
                      {savedAtStr ? <span className="ml-2 text-[#998B78]">{savedAtStr}</span> : null}
                    </div>
                    {row.also.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-[#FBF2DA] px-2 py-0.5 text-[11px] font-bold text-[#8A6324]">也属于</span>
                        {row.also.slice(0, 8).map((pack) => (
                          <span key={pack} className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[#6B5B49]">
                            {pack}
                          </span>
                        ))}
                        {row.also.length > 8 ? <span className="text-[11px] text-[#998B78]">等</span> : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </>
      );
    }

    if (wordPage === "mistakes") {
      const mistakeRowsFiltered = filterMistakeRows(allMistakeRows, mistakeLibPackFilter, mistakeWordSearch);
      const mistakePills = mistakeLibPillOptions;
      const mistakeFilterTight = mistakeLibPackFilter !== "all" || !!mistakeWordSearch.trim();
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setWordPage("list");
              setMistakeLibPackFilter("all");
              setMistakeWordSearch("");
            }}
            className="mb-4 text-left text-[14px] font-bold text-[#8A6324] active:opacity-80"
          >
            ‹ 返回单词库
          </button>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[22px] font-bold leading-tight text-[#2C241C]">错题库</h2>
              <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">目前只收单词错题，按错在哪个词库分类。</p>
            </div>
            <button type="button" onClick={() => enterMistakeLearn()} className="shrink-0 rounded-[14px] bg-[#3A2A1A] px-3 py-2 text-[11px] font-bold text-white active:scale-95">
              复习错题
            </button>
          </div>

          <Surface className="mb-4 p-3 shadow-sm">
            <input
              type="search"
              enterKeyHint="search"
              value={mistakeWordSearch}
              onChange={(e) => setMistakeWordSearch(e.target.value)}
              placeholder="搜单词 / 释义 / 出错类别"
              className="w-full rounded-[14px] border border-[#E6D8BF] bg-white/90 px-3 py-2.5 text-[14px] text-[#2C241C] placeholder:text-[#998B78] outline-none focus:border-[#8A6324]"
              autoComplete="off"
            />
          </Surface>

          <div className="mb-4 -mx-1 px-1">
            <div className="mb-2 text-[12px] font-bold text-[#998B78]">出错类别</div>
            <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
              {mistakePills.map((opt, i) => (
                <button
                  key={`${opt.value}-${i}`}
                  type="button"
                  onClick={() => setMistakeLibPackFilter(opt.value)}
                  className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold whitespace-nowrap ${
                    mistakeLibPackFilter === opt.value ? "bg-[#3A2A1A] text-white" : "bg-[#FFF8EA] text-[#6B5B49]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {mistakeRowsFiltered.length === 0 ? (
            <Surface className="p-5 text-center shadow-sm">
              <div className="text-[15px] font-bold text-[#2C241C]">
                {mistakeLibTotalCount === 0 ? "暂无错题" : mistakeFilterTight ? "没有匹配的错题" : "暂无错题"}
              </div>
              <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">
                {mistakeLibTotalCount === 0
                  ? "错题数据暂未加载。"
                  : mistakeFilterTight
                    ? "可清空搜索框或切换到「全部错题」。"
                    : "请稍后再试。"}
              </p>
            </Surface>
          ) : (
            <div className="space-y-3">
              {mistakeRowsFiltered.map((row, idx) => {
                const srcLine = row.mistakeSourcePacks?.length ? row.mistakeSourcePacks.join(" / ") : "未记录来源";
                const alsoExtra = alsoInDisplayNames(row.item, row.mistakeSourcePacks ?? []);
                return (
                  <article
                    key={`${row.wordId}-${row.category}-${idx}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        enterMistakeLearn(idx);
                      }
                    }}
                    onClick={() => enterMistakeLearn(idx)}
                    className="cursor-pointer rounded-[22px] bg-[#FFF8EA] p-4 shadow-sm ring-1 ring-[#E6D8BF] transition active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[18px] font-bold text-[#2C241C]">{row.item.word}</h3>
                          <span className="text-[12px] text-[#8A6324]">{row.item.phonetic}</span>
                          <span className="rounded-full bg-[#FBF2DA] px-2 py-0.5 text-[11px] font-bold text-[#8A6324]">{row.item.pos}</span>
                        </div>
                        <p className="mt-1 text-[14px] font-medium text-[#5f4b38]">{row.item.cn}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#FBF2DA] px-2 py-1 text-[11px] font-bold text-[#8A6324]">错</span>
                    </div>
                    {row.item.example?.trim() ? (
                      <p className="mt-3 rounded-[16px] bg-white/70 px-3 py-2 text-[12px] leading-relaxed text-[#6B5B49]">{row.item.example}</p>
                    ) : null}
                    <div className="mt-3 rounded-[16px] bg-[#F7EEDB] px-3 py-2 text-[12px] text-[#6B5B49]">
                      出错类别：<span className="font-bold text-[#2C241C]">{srcLine}</span>
                      <span className="ml-2 text-[#998B78]">{mistakeOccurrenceCount(row.wordId)} 次</span>
                    </div>
                    {alsoExtra.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-[#FBF2DA] px-2 py-0.5 text-[11px] font-bold text-[#8A6324]">也属于</span>
                        {alsoExtra.slice(0, 8).map((pack) => (
                          <span key={pack} className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[#6B5B49] ring-1 ring-[#E6D8BF]/60">
                            {pack}
                          </span>
                        ))}
                        {alsoExtra.length > 8 ? <span className="text-[11px] text-[#998B78]">等</span> : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </>
      );
    }

    const pos = v2Hydrated ? pickWordResume() : getSeedWordResume();
    const listResumeTitle = pos.pack.name;
    const listResumeSub = `第${pos.idx + 1}词 ${pos.resumeLemma ?? pos.src[pos.idx]?.word ?? ""}`;
    const listResumeProgressVal = pos.src.length ? Math.min(100, ((pos.idx + 1) / pos.src.length) * 100) : 0;

    return (
      <>
        <PageHeader title="单词库" desc="最近学习置顶；收藏单词与错题库作为特殊入口。" />
        <Surface className="mb-5 p-4">
          <div className="text-[12px] font-bold text-[#8A6324]">最近学习</div>
          <div className="mt-2 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[18px] font-bold text-[#2C241C]">{listResumeTitle}</div>
              <div className="mt-1 text-[12px] text-[#8A6324]">{listResumeSub}</div>
            </div>
            <button type="button" onClick={continueWordFromSaved} className="shrink-0 rounded-[14px] bg-[#3A2A1A] px-4 py-2.5 text-[13px] font-bold text-white active:scale-95">继续</button>
          </div>
          <div className="mt-4"><Progress value={listResumeProgressVal} /></div>
        </Surface>
        <button
          type="button"
          onClick={() => {
            setWordPage("favorites");
            setFavoriteWordPackFilter("all");
            setFavoriteWordSearch("");
          }}
          className="mb-5 w-full rounded-[22px] border border-[#E6D8BF] bg-[#FFF8EA] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#FBF2DA] text-[#8A6324]">★</div>
              <div className="min-w-0">
                <h3 className="text-[16px] font-bold text-[#2C241C]">我的收藏单词</h3>
                <p className="mt-1 text-[12px] text-[#7A6B57]">
                  {uniqueFavoriteWordCount} 个已收藏 · 按来源词库筛选
                </p>
              </div>
            </div>
            <span className="shrink-0 text-lg text-[#8A6324]">›</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => {
            setWordPage("mistakes");
            setMistakeLibPackFilter("all");
            setMistakeWordSearch("");
          }}
          className="mb-5 w-full rounded-[22px] border border-[#E6D8BF] bg-[#FFF8EA] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#FBF2DA] text-[13px] font-bold text-[#8A6324]">错</div>
              <div className="min-w-0">
                <h3 className="text-[16px] font-bold text-[#2C241C]">错题库</h3>
                <p className="mt-1 text-[12px] text-[#7A6B57]">
                  {mistakeLibTotalCount} 个单词错题 · 按出错类别筛选
                </p>
              </div>
            </div>
            <span className="shrink-0 text-lg text-[#8A6324]">›</span>
          </div>
        </button>
        {hasPersonalPack ? (
          <section className="mb-5">
            <GroupHeader title="个人词包" count={1} open={true} onClick={() => showToast("个人词包已展开")} />
            <button onClick={() => openPack(personalPackMeta)} className="w-full rounded-[20px] border border-[#E6D8BF] bg-[#FFF8EA] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] active:scale-[0.98]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[18px] font-bold text-[#2C241C]">{personalPackMeta.name}</h3>
                  <p className="mt-1 text-[12px] text-[#8A6324]">个人词包 · 可继续扩充</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[20px] font-bold text-[#2C241C]">{wordCountForPack(personalPackMeta)}</div>
                  <div className="text-[12px] text-[#998B78]">词</div>
                </div>
              </div>
              <div className="mt-4"><Progress value={0} /></div>
            </button>
          </section>
        ) : null}
        <div className="space-y-5">
          {wordGroups.map((group) => {
            const open = openWordGroups[group.title];
            return (
              <section key={group.title}>
                <GroupHeader title={group.title} count={group.items.length} open={open} onClick={() => setOpenWordGroups((prev) => ({ ...prev, [group.title]: !prev[group.title] }))} />
                {open ? (
                  <div className="space-y-3">
                    {group.items.map((pack) => {
                      const n = wordCountForPack(pack);
                      const learnedLocal = masteredWordKeys.filter((k) => k.startsWith(`${pack.id}:`)).length;
                      const progressValue = n > 0 && learnedLocal > 0 ? Math.min(100, Math.max(3, (learnedLocal / n) * 100)) : 0;
                      return (
                      <button key={pack.id} onClick={() => openPack(pack)} className="w-full rounded-[20px] border border-[#E6D8BF] bg-[#FFF8EA] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] active:scale-[0.98]">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-[18px] font-bold text-[#2C241C]">{pack.name}</h3>
                            {pack.current ? <p className="mt-1 text-[12px] text-[#8A6324]">{pack.last}</p> : null}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[20px] font-bold text-[#2C241C]">{n}</div>
                            <div className="text-[12px] text-[#998B78]">词</div>
                          </div>
                        </div>
                        <div className="mt-4"><Progress value={progressValue} /></div>
                      </button>
                    );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </>
    );
  }

  function renderTraining() {
    if (trainingPage === "aiVoice") return renderAIVoice();
    if (trainingPage === "shadow") return renderShadow();
    if (trainingPage === "writing") return renderWriting();
    return (
      <>
        <PageHeader title="训练中心" desc="把学过的词和表达用出来。" />
        <div className="space-y-3">
          {trainingCards.map((card) => (
            <button key={card.key} onClick={() => setTrainingPage(card.key)} className="w-full rounded-[22px] border border-[#E6D8BF] bg-[#FFF8EA] p-5 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] active:scale-[0.98]">
              <h3 className="text-[19px] font-bold text-[#2C241C]">{card.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">{card.desc}</p>
            </button>
          ))}
        </div>
      </>
    );
  }

  function renderShadow() {
    const shadowData = shadowDrillByType;

    if (shadowPage === "practice") {
      const list = shadowData[shadowType];
      const current = list[Math.min(shadowIndex, list.length - 1)];
      return (
        <>
          <PageHeader title={shadowType} desc={`${stage} · 左右切换练习句，跟读进度自动保存。`} back onBack={() => setShadowPage("overview")} />
          <Surface className="p-5">
            <div className="flex items-center justify-between">
              <Badge>{stage}</Badge>
              <Badge>{shadowIndex + 1}/{list.length}</Badge>
            </div>
            <div className="mt-8 rounded-[22px] bg-white p-5 text-center">
              <div className="text-[22px] font-bold leading-8 text-[#2C241C]">{current.en}</div>
              <div className="mt-3 text-[13px] leading-6 text-[#7A6B57]">{current.cn}</div>
              <button onClick={() => showToast("播放标准跟读音频")} className="mt-5 rounded-full border border-[#E6D8BF] bg-[#FFF8EA] px-5 py-2.5 text-[13px] font-bold text-[#8A6324] active:scale-95">🔊 播放示范</button>
            </div>
            <Surface className="mt-4 p-4 shadow-none">
              <div className="text-[12px] font-bold text-[#8A6324]">发音提示</div>
              <p className="mt-1 text-[13px] leading-6 text-[#6B5B49]">{current.tip}</p>
            </Surface>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <button onClick={() => setShadowIndex(Math.max(0, shadowIndex - 1))} className="rounded-[16px] bg-white py-3 text-[13px] font-bold text-[#8A6324] active:scale-95">上一句</button>
              <button onClick={() => showToast("已完成本句跟读")} className="rounded-[16px] bg-[#3A2A1A] py-3 text-[13px] font-bold text-white active:scale-95">已跟读</button>
              <button onClick={() => setShadowIndex(Math.min(list.length - 1, shadowIndex + 1))} className="rounded-[16px] bg-white py-3 text-[13px] font-bold text-[#8A6324] active:scale-95">下一句</button>
            </div>
          </Surface>
        </>
      );
    }

    return (
      <>
        <PageHeader title="口语跟读训练" desc="自动记住上次学段与分类，点进来直接续练。" back onBack={() => setTrainingPage("overview")} />
        <Surface className="mb-4 p-4">
          <div className="text-[12px] font-bold text-[#8A6324]">继续上次跟读</div>
          <div className="mt-1 text-[17px] font-bold text-[#2C241C]">{stage} · {shadowType}</div>
          <p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">上次停在第 {shadowIndex + 1} 句，可直接继续。</p>
          <button onClick={() => setShadowPage("practice")} className="mt-3 rounded-[14px] bg-[#3A2A1A] px-4 py-2.5 text-[12px] font-bold text-white active:scale-95">继续跟读</button>
        </Surface>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {shadowStages.map((s) => <button key={s} onClick={() => setStage(s)} className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${stage === s ? "bg-[#3A2A1A] text-white" : "bg-[#FFF8EA] text-[#6B5B49]"}`}>{s}</button>)}
        </div>
        <div className="space-y-3">
          {shadowTypes.map((t) => (
            <button key={t} onClick={() => { setShadowType(t); setShadowIndex(0); setShadowPage("practice"); }} className="w-full rounded-[18px] border border-[#E6D8BF] bg-[#FFF8EA] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] active:scale-[0.98]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[16px] font-bold text-[#2C241C]">{t}</div>
                  <div className="mt-1 text-[12px] text-[#7A6B57]">当前学段：{stage} · {shadowData[t].length}句</div>
                </div>
                <div className="text-[#8A6324]">›</div>
              </div>
            </button>
          ))}
        </div>
      </>
    );
  }

  function renderAIVoice() {
    /** 底部输入条状态：主次分明（含朗读中），与气泡内容解耦 */
    const composerStatus =
      chatTranscribing
        ? { label: "语音识别中…", dot: "bg-[#D8B65E] animate-pulse" }
        : chatAiBusy
          ? { label: "AI 正在回复…", dot: "bg-[#D8B65E] animate-pulse" }
          : chatAudioLoadingId != null
            ? { label: "正在朗读本条英文…", dot: "bg-[#8A6324]/80 animate-pulse" }
            : recording
              ? { label: "正在收音，松开即可发送", dot: "bg-[#c45c3e] animate-pulse" }
              : { label: "先写英文点「发送」，或按住说话。", dot: "bg-[#B0A18D]" };
    const composerSafeBottom = "calc(env(safe-area-inset-bottom, 0px) + 12px)";
    const currentChatSession = chatSessions.find((item) => item.id === currentChatSessionId) ?? null;

    const handleAiWheelCapture = (event) => {
      if (typeof window === "undefined") return;
      if (!window.matchMedia("(pointer:fine) and (min-width: 768px)").matches) return;
      const el = chatScrollRef.current;
      if (!el) return;
      const delta = event.deltaY;
      const canScrollUp = delta < 0 && el.scrollTop > 0;
      const canScrollDown = delta > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      if (!canScrollUp && !canScrollDown) return;
      event.preventDefault();
      el.scrollTop += delta * 1.1;
    };

    return (
        <div ref={aiPageRef} onWheelCapture={handleAiWheelCapture} className="relative flex h-full min-h-0 flex-col overflow-hidden">
        <div className="shrink-0 px-1 pt-1 md:px-5 md:pt-4">
          <PageHeader title="AI 英语自由闲聊" desc="不设题目，点词可查，轻松英文聊天。" back onBack={() => setTrainingPage("overview")} />
        </div>

        <section className="relative mx-1 shrink-0 overflow-hidden rounded-[18px] bg-gradient-to-br from-[#3b2818] to-[#2a1c12] px-3 py-2.5 text-white shadow-lg ring-1 ring-black/15 md:mx-5 md:rounded-[22px] md:px-4 md:py-3">
          <div className="text-[10px] font-bold tracking-wide text-[#f5d88a]/90 md:text-[11px]">
            <span>{scene}</span>
            <span className="mx-1.5 text-[#f5d88a]/40">·</span>
            <span>{voice}</span>
            <span className="mx-1.5 text-[#f5d88a]/40">·</span>
            <span>{speed}</span>
            {subtitlesOn ? <span className="text-[#f5d88a]/55"> · 中英对照</span> : null}
          </div>

          <p className="mt-1.5 text-[13px] font-bold leading-snug text-white md:mt-2 md:text-[16px]">
            开始一段随意英文会话
          </p>

          <p className="mt-1 max-w-[280px] text-[11px] font-medium leading-5 text-white/74 sm:max-w-none md:mt-1.5 md:text-[12px]">
            发一句英文，AI 会自然接话，可随时开字幕对照。
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 md:mt-3 md:gap-2">
            <button
              type="button"
              onClick={() => setCallOpen(true)}
              className="rounded-full border border-white/14 bg-white/8 px-2.5 py-1.5 text-[10px] font-bold text-[#f5e6c8] active:scale-95 md:px-3 md:py-2"
              aria-label="电话模式"
            >
              📞 电话
            </button>
            <button
              type="button"
              onClick={() => startNewChatSession()}
              className="rounded-full border border-white/14 bg-white/8 px-2.5 py-1.5 text-[10px] font-bold text-[#f5e6c8] active:scale-95 md:px-3 md:py-2"
              aria-label="新对话"
            >
              新对话
            </button>
            <button
              type="button"
              onClick={() => setSubtitlesOn((v) => !v)}
              className={cx(
                "rounded-full border px-2.5 py-1.5 text-[10px] font-bold active:scale-95 md:px-3 md:py-2",
                subtitlesOn
                  ? "border-[#d1a53d]/60 bg-[#d1a53d]/25 text-[#ffe8ad]"
                  : "border-white/14 bg-white/8 text-[#f5e6c8]",
              )}
              aria-label="字幕开关"
            >
              字幕
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="rounded-full border border-white/12 bg-transparent px-2.5 py-1.5 text-[10px] font-bold text-white/60 active:scale-95 md:ml-auto md:px-3 md:py-2"
              aria-label="更多设置"
            >
              设置
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-white/60 md:gap-2">
            <button type="button" onClick={() => setHistoryOpen(true)} className="rounded-full border border-white/12 px-2.5 py-1 active:scale-95">
              历史记录
            </button>
            <button type="button" onClick={() => clearCurrentChatSession()} className="rounded-full border border-white/12 px-2.5 py-1 active:scale-95">
              清空当前会话
            </button>
            <span className="min-w-0 flex-1 truncate text-white/52">{currentChatSession?.title ?? "新对话"}</span>
          </div>
        </section>

        <div ref={chatScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-2 pt-2 md:px-5 md:pb-3 md:pt-3">
          <div className="space-y-3 md:space-y-[14px]">
            {chatMessages.map((msg) => {
              const isUser = msg.role === "user";
              const playBusy = chatAudioLoadingId === Number(msg.id);
              return (
                <div key={msg.id} className={cx("flex", isUser ? "justify-end" : "justify-start")}>
                  <div className="min-w-0 max-w-[94%] sm:max-w-[88%]">
                    <div
                      className={cx(
                        "overflow-hidden rounded-[22px] shadow-[0_8px_22px_rgba(58,42,26,0.07)] ring-1",
                        isUser ? "rounded-br-md bg-[#3A2A1A] text-white ring-black/15" : "rounded-bl-md bg-[#FFF8EA] ring-[#E6D8BF]",
                      )}
                    >
                      <div className={cx("flex items-center justify-between gap-2 border-b px-3 py-1.5 md:py-2", isUser ? "border-white/10" : "border-[#E6D8BF]/55")}>
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span
                            className={cx(
                              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black tracking-wide",
                              isUser ? "bg-white/12 text-white/95" : "bg-[#F7EEDB] text-[#8A6324]",
                            )}
                          >
                            {isUser ? "我" : "AI"}
                          </span>
                          <span className={cx("text-[10px] font-bold tabular-nums", isUser ? "text-white/45" : "text-[#998B78]")}>{msg.time}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            void playChatMessage(msg);
                          }}
                          disabled={playBusy}
                          aria-busy={playBusy}
                          aria-label={playBusy ? "朗读进行中" : "播放本条英文"}
                          className={cx(
                            "relative flex h-7 shrink-0 items-center justify-center rounded-full px-2.5 text-[11px] font-bold transition active:scale-95 disabled:opacity-55 md:h-8 md:text-[12px]",
                            isUser ? "bg-white/12 text-white ring-1 ring-white/14" : "bg-white text-[#8A6324] ring-1 ring-[#E6D8BF]",
                          )}
                        >
                          {playBusy ? <span className="text-[10px] tracking-tight">···</span> : <>🔊</>}
                        </button>
                      </div>
                      <div className="px-3 pb-3 pt-2.5 md:px-3.5 md:pb-3.5 md:pt-3">
                        <div className={cx("text-[14px] font-semibold leading-6 tracking-[-0.01em] md:text-[15px] md:leading-relaxed", isUser ? "text-white" : "text-[#2C241C]")}>
                          <BubbleText text={msg.text} onWordClick={setSelectedWordTip} />
                        </div>
                        {subtitlesOn ? (
                          <div className={cx("mt-2 border-t pt-2 md:mt-2.5 md:pt-2.5", isUser ? "border-white/10" : "border-[#E6D8BF]/55")}>
                            <p className={cx("text-[11px] font-medium leading-5 md:text-[12px] md:leading-relaxed", isUser ? "text-white/72" : "text-[#6B5B49]")}>
                              <span className={cx("mr-1.5 text-[10px] font-black uppercase opacity-70", isUser ? "text-white/45" : "text-[#B0A18D]")}>
                                译
                              </span>
                              {getFreeChatSubtitle(msg)}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="relative z-10 shrink-0 border-t border-[#E6D8BF]/85 bg-[#F6EAD6]/96 px-1 pb-0 pt-2 backdrop-blur md:px-5 md:pt-3"
          style={{ paddingBottom: composerSafeBottom }}
        >
          <div className="rounded-[18px] border border-[#E6D8BF] bg-[#FFF8EA]/98 p-3 shadow-[0_-8px_26px_rgba(58,42,26,0.05)] md:rounded-[22px] md:p-4">
            <div className="mb-2 flex items-center gap-2 md:mb-3">
              <span className={cx("h-2 w-2 shrink-0 rounded-full", composerStatus.dot)} />
              <span className="text-[11px] font-bold leading-snug text-[#6B5B49]">{composerStatus.label}</span>
            </div>
            <div className="flex flex-col gap-2 md:gap-2.5">
              <div className="flex items-stretch gap-2">
                <input
                  value={customText}
                  disabled={chatAiBusy || chatTranscribing}
                  onChange={(e) => setCustomText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitTextChat();
                    }
                  }}
                  placeholder="先用英文写下来… Enter 发送"
                  className="min-h-[42px] min-w-0 flex-1 rounded-[16px] border border-[#E6D8BF] bg-white px-3 py-2.5 text-[13px] font-medium leading-snug text-[#2C241C] outline-none placeholder:text-[#AD9F8C] placeholder:font-normal disabled:bg-[#faf5ec] md:min-h-[48px] md:rounded-[18px] md:px-4 md:py-3 md:text-[14px]"
                />
                <button
                  type="button"
                  disabled={chatAiBusy || chatTranscribing || !customText.trim()}
                  onClick={() => submitTextChat()}
                  className="shrink-0 rounded-[16px] bg-[#3A2A1A] px-3.5 py-2.5 text-[12px] font-bold text-white shadow-[0_4px_14px_rgba(58,42,26,0.16)] active:scale-[0.98] disabled:bg-[#C7B8A5] disabled:text-white/70 disabled:shadow-none md:rounded-[18px] md:px-4 md:py-3 md:text-[13px]"
                >
                  发送
                </button>
              </div>
              <button
                type="button"
                disabled={chatAiBusy || chatTranscribing}
                onPointerDown={handlePressToTalkStart}
                onPointerUp={handlePressToTalkEnd}
                onPointerCancel={handlePressToTalkEnd}
                className={cx(
                  "flex h-10 w-full items-center justify-center rounded-[14px] text-[12px] font-bold transition active:scale-[0.99] md:h-11 md:rounded-[16px] md:text-[13px]",
                  chatAiBusy || chatTranscribing
                    ? "border border-transparent bg-[#E8DDD0] text-[#998B78]"
                    : recording
                      ? "border border-[#D8B65E] bg-[#FBF2DA] text-[#6B4918]"
                      : "border-2 border-dashed border-[#D8C4A8] bg-white/98 text-[#8A6324]",
                )}
              >
                {chatTranscribing ? "识别中…请稍候" : recording ? "松开结束本条语音" : "按住说话（语音输入）"}
              </button>
            </div>
          </div>
        </div>

        <FreeChatSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="会话设置" subtitle="调音色语速与情景，返回后即时生效">
          <p className="mb-4 text-[11px] leading-5 text-[#998B78]">主聊天始终在下方列表与输入框；此处为附加选项。</p>
          <div className="space-y-5">
            <div>
              <div className="mb-2 text-[12px] font-bold text-[#8A6324]">对话形式</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {freeChatModes.map((item) => (
                  <FreeChatPill key={item} active={chatMode === item} onClick={() => { setChatMode(item); if (item === "电话模式") setCallOpen(true); }}>
                    {item}
                  </FreeChatPill>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[12px] font-bold text-[#8A6324]">音色</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {VOICE_GENDERS.map((item) => (
                  <FreeChatPill key={item} active={voice === item} onClick={() => setVoice(item)}>
                    {item}
                  </FreeChatPill>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[12px] font-bold text-[#8A6324]">语速</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {speeds.map((item) => (
                  <FreeChatPill key={item} active={speed === item} onClick={() => setSpeed(item)}>
                    {item}
                  </FreeChatPill>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[12px] font-bold text-[#8A6324]">情景</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {freeChatScenes.map((item) => (
                  <FreeChatPill key={item} active={scene === item} onClick={() => setScene(item)}>
                    {item}
                  </FreeChatPill>
                ))}
              </div>
            </div>
          </div>
        </FreeChatSheet>

        <FreeChatSheet open={historyOpen} onClose={() => setHistoryOpen(false)} title="历史记录" subtitle="最近会话保存在当前设备，可恢复、继续或新建。">
          <div className="mb-3 flex gap-2">
            <button type="button" onClick={() => startNewChatSession()} className="rounded-[14px] bg-[#3A2A1A] px-4 py-2 text-[12px] font-bold text-white active:scale-95">新对话</button>
            <button type="button" onClick={() => clearCurrentChatSession()} className="rounded-[14px] bg-white px-4 py-2 text-[12px] font-bold text-[#8A6324] ring-1 ring-[#E6D8BF] active:scale-95">清空当前会话</button>
          </div>
          <div className="max-h-[58dvh] space-y-[10px] overflow-y-auto pr-1">
            {chatSessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => openChatSession(session.id)}
                className={cx(
                  "w-full rounded-[18px] border p-3.5 text-left shadow-sm active:scale-[0.99]",
                  session.id === currentChatSessionId
                    ? "border-[#D8B65E] bg-[#FBF2DA]"
                    : "border-[#E6D8BF] bg-white",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-bold text-[#2C241C]">{session.title || "新对话"}</div>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#6B5B49]">
                      {(session.messages.find((msg) => msg.role === "user" && msg.text.trim())?.text || session.messages[session.messages.length - 1]?.text || "还没有消息").trim()}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold text-[#998B78]">{formatFavoriteSavedAt(session.updatedAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </FreeChatSheet>

        <PhoneCallOverlay
          open={callOpen}
          voiceModel={getFreeChatVoiceModel(voice)}
          subtitlesOn={subtitlesOn}
          onToggleSubtitles={() => setSubtitlesOn((v) => !v)}
          micPhase={callPhoneMicPhase}
          recording={callRecording}
          transcribing={chatTranscribing}
          busy={chatAiBusy}
          audioPlaying={chatAudioLoadingId != null}
          onStartListening={handleCallStartListening}
          onPauseListening={handleCallPauseListening}
          onHangUp={handleCallHangUp}
          latestMessage={latestChatMessage}
          soloSeedWelcome={
            chatMessages.length === 1 &&
            chatMessages[0]?.role === "ai" &&
            chatMessages[0]?.id === freeChatInitialMessages[0]?.id
          }
        />

        <WordHintCard tip={selectedWordTip} onClose={() => setSelectedWordTip(null)} />
      </div>
    );
  }

  function renderWriting() {
    if (writingPage !== "overview") {
      const data = writingMap[writingPage];
      const isSaved = (index) => favorites.writing.includes(makeWritingFavoriteId(writingPage, index));
      const isRecent = (index) => recentLearning.some((r) => r.kind === "writing" && r.ref === `${writingPage}:${index}`);
      const writingFilters = ["全部", "收藏", "最近", ...Array.from(new Set(data.items.map(([title]) => title)))];
      const keyword = writingSearch.trim().toLowerCase();
      const filteredWritingItems = data.items
        .map((item, index) => ({ item, index }))
        .filter(({ item, index }) => {
          const [title, main, desc] = item;
          const text = `${title} ${main} ${desc}`.toLowerCase();
          const matchesKeyword = !keyword || text.includes(keyword);
          const matchesFilter = writingFilter === "全部" ||
            (writingFilter === "收藏" ? isSaved(index) : writingFilter === "最近" ? isRecent(index) : title === writingFilter);
          return matchesKeyword && matchesFilter;
        });
      const visibleWritingItems = showAllWritingItems ? filteredWritingItems : filteredWritingItems.slice(0, 5);
      return (
        <>
          <PageHeader title={writingPage} desc={data.desc} back onBack={() => setWritingPage("overview")} />
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {writingStages.map((s) => (
              <button key={s} onClick={() => setWritingStage(s)} className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${writingStage === s ? "bg-[#3A2A1A] text-white" : "bg-[#FFF8EA] text-[#6B5B49]"}`}>{s}</button>
            ))}
          </div>
          <Surface className="mb-4 p-4">
            <div className="text-[12px] font-bold text-[#8A6324]">当前学段</div>
            <div className="mt-1 text-[17px] font-bold text-[#2C241C]">{writingStage}写作训练</div>
            <p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">默认跟随当前学习目标，可随时切换学段。</p>
          </Surface>
          <div className="mb-4 space-y-3">
            <input value={writingSearch} onChange={(e) => { setWritingSearch(e.target.value); setShowAllWritingItems(false); }} placeholder="搜索框架 / 关键词，例如：开头、结尾、原因" className="w-full rounded-[16px] border border-[#E6D8BF] bg-white px-4 py-3 text-[13px] text-[#2C241C] outline-none placeholder:text-[#B0A18D]" />
            <div className="flex gap-2 overflow-x-auto pb-1">
              {writingFilters.map((filter) => (
                <button key={filter} onClick={() => { setWritingFilter(filter); setShowAllWritingItems(false); }} className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-bold ${writingFilter === filter ? "bg-[#3A2A1A] text-white" : "bg-[#FFF8EA] text-[#6B5B49]"}`}>{filter}</button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {visibleWritingItems.map(({ item, index }) => {
              const [title, main, desc] = item;
              return (
              <Surface key={title + main} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[12px] font-bold text-[#8A6324]">{title}</div>
                    <div className="flex gap-1">
                      {isRecent(index) ? <span className="rounded-full bg-[#FBF2DA] px-2 py-0.5 text-[10px] font-bold text-[#8A6324]">最近</span> : null}
                      {isSaved(index) ? <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#8A6324]">收藏</span> : null}
                    </div>
                  </div>
                  <div className="mt-2 text-[15px] font-bold leading-6 text-[#2C241C]">{main}</div>
                  <p className="mt-2 text-[12px] leading-5 text-[#6B5B49]">{desc}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const fid = makeWritingFavoriteId(writingPage, index);
                      const has = favorites.writing.includes(fid);
                      setFavorites((f) => ({ ...f, writing: has ? f.writing.filter((x) => x !== fid) : [...f.writing, fid] }));
                      addRecent({
                        id: `writing-${writingPage}-${index}`,
                        kind: "writing",
                        label: `${writingPage} · ${title}`,
                        ref: `${writingPage}:${index}`,
                      });
                      showToast(has ? "已取消收录" : "已收录到个人素材库");
                    }}
                    className="mt-3 rounded-[14px] bg-[#3A2A1A] px-4 py-2.5 text-[12px] font-bold text-white active:scale-95"
                  >
                    收录
                  </button>
                </Surface>
              );
            })}
            {filteredWritingItems.length === 0 ? (
              <Surface className="p-5 text-center">
                <div className="text-[15px] font-bold text-[#2C241C]">没有找到对应内容</div>
                <p className="mt-2 text-[12px] leading-5 text-[#6B5B49]">换个关键词，或切回“全部”继续查看。</p>
              </Surface>
            ) : null}
            {filteredWritingItems.length > 5 ? (
              <button onClick={() => setShowAllWritingItems(!showAllWritingItems)} className="w-full rounded-[16px] border border-[#E6D8BF] bg-[#FFF8EA] py-3 text-[13px] font-bold text-[#8A6324] active:scale-[0.98]">
                {showAllWritingItems ? "收起部分内容" : `查看更多 ${filteredWritingItems.length - 5} 条`}
              </button>
            ) : null}
          </div>
        </>
      );
    }

    return (
      <>
        <PageHeader title="写作表达训练" desc="分学段练框架、句型、素材。" back onBack={() => setTrainingPage("overview")} />
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {writingStages.map((s) => (
            <button key={s} onClick={() => setWritingStage(s)} className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${writingStage === s ? "bg-[#3A2A1A] text-white" : "bg-[#FFF8EA] text-[#6B5B49]"}`}>{s}</button>
          ))}
        </div>
        <div className="space-y-3">
          {writingTypes.map((t) => {
            const desc = {
              "万能框架": "先搭结构，再填内容",
              "高分句型": "替换低分表达",
              "话题素材": "积累常考语料",
              "原创范文拆解": "只看结构逻辑",
            }[t];
            return (
              <button key={t} onClick={() => { setWritingPage(t); setShowAllWritingItems(false); setWritingSearch(""); setWritingFilter("全部"); }} className="w-full rounded-[18px] border border-[#E6D8BF] bg-[#FFF8EA] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] active:scale-[0.98]">
                <div className="text-[16px] font-bold text-[#2C241C]">{t}</div>
                <div className="mt-1 text-[12px] text-[#7A6B57]">{writingStage} · {desc}</div>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  function renderWorkbench() {
    if (workbenchPage === "sceneForm") {
      return (
        <>
          <PageHeader title="自定义场景生成器" desc="输入场景，生成口语脚本。" back onBack={() => setWorkbenchPage("overview")} />
          <Surface className="p-5">
            <div className="text-[13px] font-bold text-[#2C241C]">你想练什么场景？</div>
            <textarea value={sceneInput} onChange={(e) => setSceneInput(e.target.value)} className="mt-3 min-h-[120px] w-full rounded-[16px] border border-[#E6D8BF] bg-white p-4 text-[13px] leading-6 text-[#2C241C] outline-none" />
            <button onClick={() => { setHasRecentGenerate(true); setWorkbenchPage("sceneResult"); showToast("已生成口语练习包"); }} className="mt-4 w-full rounded-[16px] bg-[#3A2A1A] py-3 text-[14px] font-bold text-white active:scale-[0.98]">生成练习包</button>
          </Surface>
          <Surface className="mt-4 p-4">
            <div className="text-[13px] font-bold text-[#2C241C]">生成后会包含</div>
            <p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">对话脚本、跟读短句、可收藏表达。生成内容先进入最近生成，确认有用后再收录。</p>
          </Surface>
        </>
      );
    }

    if (workbenchPage === "sceneResult") {
      return (
        <>
          <PageHeader title="生成结果" desc="先预览，再决定收录或加入训练。" back onBack={() => setWorkbenchPage("overview")} />
          <Surface className="p-5">
            <div className="text-[12px] font-bold text-[#8A6324]">场景</div>
            <h2 className="mt-2 text-[19px] font-bold text-[#2C241C]">机场值机与行李托运</h2>
            <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">{sceneInput}</p>
          </Surface>

          <div className="mt-4"><SectionTitle title="对话脚本" /></div>
          <div className="space-y-2">
            {sceneScript.map(([role, text], gi) => {
              if (!showFullSceneResult && gi >= 4) return null;
              const fid = makeWorkbenchFavoriteId("scene", "script", gi);
              const has = favorites.workbench.includes(fid);
              return (
                <Surface key={gi} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-bold text-[#8A6324]">{role}</div>
                      <div className="mt-1 text-[14px] leading-6 text-[#2C241C]">{text}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const h = favorites.workbench.includes(fid);
                        setFavorites((f) => ({ ...f, workbench: h ? f.workbench.filter((x) => x !== fid) : [...f.workbench, fid] }));
                        addRecent({ id: `wb-${fid}`, kind: "workbench", label: `${role} · ${text.slice(0, 24)}`, ref: fid });
                        showToast(h ? "已取消收录" : "已收录");
                      }}
                      className="shrink-0 rounded-full bg-[#FBF2DA] px-3 py-1.5 text-[11px] font-bold text-[#8A6324] active:scale-95"
                    >
                      {has ? "已藏" : "收录"}
                    </button>
                  </div>
                </Surface>
              );
            })}
          </div>

          <div className="mt-5"><SectionTitle title="跟读短句" /></div>
          <div className="space-y-2">
            {shadowLines.map((line, gi) => {
              if (!showFullSceneResult && gi >= 3) return null;
              const fid = makeWorkbenchFavoriteId("scene", "shadow", gi);
              const has = favorites.workbench.includes(fid);
              return (
                <Surface key={gi} className="flex flex-wrap items-center gap-3 p-4">
                  <button type="button" onClick={() => showToast("播放跟读句")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E6D8BF] bg-[#FFF8EA] text-[13px] text-[#8A6324] active:scale-95">🔊</button>
                  <div className="min-w-0 flex-1 text-[14px] leading-6 text-[#2C241C]">{line}</div>
                  <button
                    type="button"
                    onClick={() => {
                      const h = favorites.workbench.includes(fid);
                      setFavorites((f) => ({ ...f, workbench: h ? f.workbench.filter((x) => x !== fid) : [...f.workbench, fid] }));
                      addRecent({ id: `wb-${fid}`, kind: "workbench", label: line.slice(0, 28), ref: fid });
                      showToast(h ? "已取消收录" : "已收录");
                    }}
                    className="shrink-0 rounded-full bg-[#FBF2DA] px-3 py-1.5 text-[11px] font-bold text-[#8A6324] active:scale-95"
                  >
                    {has ? "已藏" : "收录"}
                  </button>
                </Surface>
              );
            })}
          </div>

          <div className="mt-5"><SectionTitle title="可收藏表达" /></div>
          <div className="space-y-2">
            {usefulExpressions.map((line, gi) => {
              if (!showFullSceneResult && gi >= 3) return null;
              const fid = makeWorkbenchFavoriteId("scene", "expr", gi);
              const has = favorites.workbench.includes(fid);
              return (
                <Surface key={gi} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[14px] leading-6 text-[#2C241C]">{line}</div>
                    <button
                      type="button"
                      onClick={() => {
                        const h = favorites.workbench.includes(fid);
                        setFavorites((f) => ({ ...f, workbench: h ? f.workbench.filter((x) => x !== fid) : [...f.workbench, fid] }));
                        addRecent({ id: `wb-${fid}`, kind: "workbench", label: line.slice(0, 28), ref: fid });
                        showToast(h ? "已取消收录" : "已收录");
                      }}
                      className="shrink-0 rounded-full bg-[#FBF2DA] px-3 py-1.5 text-[11px] font-bold text-[#8A6324] active:scale-95"
                    >
                      {has ? "已藏" : "收录"}
                    </button>
                  </div>
                </Surface>
              );
            })}
          </div>

          <div className="mt-5 space-y-3">
            <button onClick={() => setShowFullSceneResult(!showFullSceneResult)} className="w-full rounded-[16px] border border-[#E6D8BF] bg-[#FFF8EA] py-3 text-[13px] font-bold text-[#8A6324] active:scale-[0.98]">
              {showFullSceneResult ? "收起部分内容" : "查看完整练习包"}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button onClick={() => showToast("已收录到个人素材库")} className="rounded-[16px] bg-[#3A2A1A] py-3 text-[13px] font-bold text-white active:scale-[0.98]">收录素材库</button>
            <button onClick={() => { setActiveTab("training"); setTrainingPage("shadow"); }} className="rounded-[16px] bg-white py-3 text-[13px] font-bold text-[#8A6324] active:scale-[0.98]">加入跟读</button>
            <button onClick={() => { setActiveTab("training"); setTrainingPage("aiVoice"); setScene("自定义角色"); }} className="col-span-2 rounded-[16px] bg-[#FFF8EA] py-3 text-[13px] font-bold text-[#8A6324] active:scale-[0.98]">进入AI对话练习</button>
          </div>
        </>
      );
    }

    if (workbenchPage === "textForm") {
      return (
        <>
          <PageHeader title="文本智能解析" desc="粘贴文章，提炼生词句型。" back onBack={() => setWorkbenchPage("overview")} />
          <Surface className="p-5">
            <div className="text-[13px] font-bold text-[#2C241C]">粘贴英文文本</div>
            <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} className="mt-3 min-h-[180px] w-full rounded-[16px] border border-[#E6D8BF] bg-white p-4 text-[13px] leading-6 text-[#2C241C] outline-none" />
            <button onClick={() => { setHasRecentParse(true); setWorkbenchPage("textResult"); showToast("已完成文本解析"); }} className="mt-4 w-full rounded-[16px] bg-[#3A2A1A] py-3 text-[14px] font-bold text-white active:scale-[0.98]">开始解析</button>
          </Surface>
          <Surface className="mt-4 p-4">
            <div className="text-[13px] font-bold text-[#2C241C]">解析后会得到</div>
            <p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">重点生词、高频短语、长难句。结果可生成专属词包，也可加入跟读任务。</p>
          </Surface>
        </>
      );
    }

    if (workbenchPage === "textResult") {
      return (
        <>
          <PageHeader title="解析结果" desc="默认只展示重点内容，避免信息过载。" back onBack={() => setWorkbenchPage("overview")} />
          <Surface className="p-5">
            <div className="text-[12px] font-bold text-[#8A6324]">原文摘要</div>
            <p className="mt-2 line-clamp-3 text-[13px] leading-6 text-[#6B5B49]">{textInput}</p>
          </Surface>

          <div className="mt-4"><SectionTitle title="重点生词" /></div>
          <div className="space-y-2">
            {parsedWords.map(([word, desc], gi) => {
              if (!showFullTextResult && gi >= 5) return null;
              const fid = makeWorkbenchFavoriteId("text", "word", gi);
              const has = favorites.workbench.includes(fid);
              return (
                <Surface key={word} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <div className="text-[16px] font-bold text-[#2C241C]">{word}</div>
                    <div className="mt-1 text-[12px] text-[#7A6B57]">{desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const h = favorites.workbench.includes(fid);
                      setFavorites((f) => ({ ...f, workbench: h ? f.workbench.filter((x) => x !== fid) : [...f.workbench, fid] }));
                      addRecent({ id: `wb-${fid}`, kind: "workbench", label: word, ref: fid });
                      showToast(h ? "已取消收录" : "已收录");
                    }}
                    className="rounded-full bg-[#FBF2DA] px-3 py-1.5 text-[12px] font-bold text-[#8A6324] active:scale-95"
                  >
                    {has ? "已藏" : "加入"}
                  </button>
                </Surface>
              );
            })}
          </div>

          <div className="mt-5"><SectionTitle title="高频短语" /></div>
          <div className="flex flex-wrap gap-2">
            {parsedPhrases.map((phrase, gi) => {
              if (!showFullTextResult && gi >= 5) return null;
              const fid = makeWorkbenchFavoriteId("text", "phrase", gi);
              const has = favorites.workbench.includes(fid);
              return (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => {
                    const h = favorites.workbench.includes(fid);
                    setFavorites((f) => ({ ...f, workbench: h ? f.workbench.filter((x) => x !== fid) : [...f.workbench, fid] }));
                    addRecent({ id: `wb-${fid}`, kind: "workbench", label: phrase.slice(0, 24), ref: fid });
                    showToast(h ? "已取消收录" : "已收录短语");
                  }}
                  className={`rounded-full border border-[#E6D8BF] px-3 py-2 text-[12px] font-bold active:scale-95 ${has ? "bg-[#3A2A1A] text-white" : "bg-[#FFF8EA] text-[#8A6324]"}`}
                >
                  {phrase}
                </button>
              );
            })}
          </div>

          <div className="mt-5"><SectionTitle title="长难句" /></div>
          <div className="space-y-2">
            {parsedSentences.map((sentence, gi) => {
              if (!showFullTextResult && gi >= 2) return null;
              const fid = makeWorkbenchFavoriteId("text", "sentence", gi);
              const has = favorites.workbench.includes(fid);
              return (
                <Surface key={gi} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[14px] leading-6 text-[#2C241C]">{sentence}</div>
                    <button
                      type="button"
                      onClick={() => {
                        const h = favorites.workbench.includes(fid);
                        setFavorites((f) => ({ ...f, workbench: h ? f.workbench.filter((x) => x !== fid) : [...f.workbench, fid] }));
                        addRecent({ id: `wb-${fid}`, kind: "workbench", label: sentence.slice(0, 28), ref: fid });
                        showToast(h ? "已取消收录" : "已收录");
                      }}
                      className="shrink-0 rounded-full bg-[#FBF2DA] px-3 py-1.5 text-[11px] font-bold text-[#8A6324] active:scale-95"
                    >
                      {has ? "已藏" : "收录"}
                    </button>
                  </div>
                </Surface>
              );
            })}
          </div>

          <div className="mt-5 space-y-3">
            <button onClick={() => setShowFullTextResult(!showFullTextResult)} className="w-full rounded-[16px] border border-[#E6D8BF] bg-[#FFF8EA] py-3 text-[13px] font-bold text-[#8A6324] active:scale-[0.98]">
              {showFullTextResult ? "收起部分内容" : "查看更多解析结果"}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button onClick={() => { setHasPersonalPack(true); setActiveTab("words"); setWordPage("list"); showToast("已生成专属词包"); }} className="rounded-[16px] bg-[#3A2A1A] py-3 text-[13px] font-bold text-white active:scale-[0.98]">生成词包</button>
            <button onClick={() => { setActiveTab("training"); setTrainingPage("shadow"); }} className="rounded-[16px] bg-white py-3 text-[13px] font-bold text-[#8A6324] active:scale-[0.98]">加入跟读</button>
            <button onClick={() => showToast("已收录到个人素材库")} className="col-span-2 rounded-[16px] bg-[#FFF8EA] py-3 text-[13px] font-bold text-[#8A6324] active:scale-[0.98]">收录素材库</button>
          </div>
        </>
      );
    }

    return (
      <>
        <PageHeader title="工作台" desc="生成内容先进最近生成，确认有用后再收录。" />
        <SectionTitle title="工具区" />
        <div className="space-y-3">
          <Surface className="p-5">
            <h3 className="text-[18px] font-bold text-[#2C241C]">自定义场景生成器</h3>
            <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">输入任意场景，生成对话、短句和可收藏表达。</p>
            <button onClick={() => setWorkbenchPage("sceneForm")} className="mt-4 rounded-[14px] bg-[#3A2A1A] px-4 py-3 text-[13px] font-bold text-white active:scale-95">进入</button>
          </Surface>
          <Surface className="p-5">
            <h3 className="text-[18px] font-bold text-[#2C241C]">文本智能解析工具</h3>
            <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">粘贴英文，提取生词、短语和长难句。</p>
            <button onClick={() => setWorkbenchPage("textForm")} className="mt-4 rounded-[14px] bg-[#3A2A1A] px-4 py-3 text-[13px] font-bold text-white active:scale-95">进入</button>
          </Surface>
        </div>
        <div className="mt-6"><SectionTitle title="素材区" /></div>
        {hasRecentGenerate || hasRecentParse ? (
          <div className="space-y-3">
            {hasRecentGenerate ? (
              <Surface className="p-5">
                <div className="text-[12px] font-bold text-[#8A6324]">最近生成 · 场景</div>
                <h3 className="mt-2 text-[17px] font-bold text-[#2C241C]">机场值机与行李托运</h3>
                <p className="mt-1 text-[13px] leading-6 text-[#6B5B49]">包含对话脚本、3句跟读短句、3条可收藏表达。</p>
                <button onClick={() => setWorkbenchPage("sceneResult")} className="mt-4 rounded-[14px] bg-[#3A2A1A] px-4 py-3 text-[13px] font-bold text-white active:scale-95">查看结果</button>
              </Surface>
            ) : null}
            {hasRecentParse ? (
              <Surface className="p-5">
                <div className="text-[12px] font-bold text-[#8A6324]">最近生成 · 文本解析</div>
                <h3 className="mt-2 text-[17px] font-bold text-[#2C241C]">语言学习短文解析</h3>
                <p className="mt-1 text-[13px] leading-6 text-[#6B5B49]">包含5个重点生词、4个高频短语、2个长难句。</p>
                <button onClick={() => setWorkbenchPage("textResult")} className="mt-4 rounded-[14px] bg-[#3A2A1A] px-4 py-3 text-[13px] font-bold text-white active:scale-95">查看结果</button>
              </Surface>
            ) : null}
          </div>
        ) : (
          <Surface className="p-5 text-center">
            <div className="text-[17px] font-bold text-[#2C241C]">暂无生成内容</div>
            <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">试试输入一个场景，生成你的第一组练习素材。</p>
            <button onClick={() => setWorkbenchPage("sceneForm")} className="mt-4 rounded-[14px] bg-[#3A2A1A] px-4 py-3 text-[13px] font-bold text-white active:scale-95">去生成</button>
          </Surface>
        )}
      </>
    );
  }

  function renderMine() {
    const maskedPhone = phoneAuthState?.phoneMasked || (cloudSyncProfile?.phone ? maskPhone(cloudSyncProfile.phone) : "");
    const loggedIn = !!phoneAuthState && !!cloudSyncProfile?.enabled;

    if (minePage === "stats") {
      return (
        <>
          <PageHeader title="学习数据" desc="汇总全局学习情况，复杂数据统一放在这里。" back onBack={() => setMinePage("overview")} />
          <div className="grid grid-cols-2 gap-3">
            {[["已学词数", "128"], ["连续学习", "6天"], ["待复习", "8"], ["训练次数", "21"]].map(([label, value]) => (
              <Surface key={label} className="p-4 text-center">
                <div className="text-[22px] font-bold text-[#2C241C]">{value}</div>
                <div className="mt-1 text-[12px] text-[#8A6324]">{label}</div>
              </Surface>
            ))}
          </div>
          <Surface className="mt-4 p-5">
            <div className="text-[13px] font-bold text-[#2C241C]">本周学习概览</div>
            <div className="mt-4 space-y-3">
              {[["单词学习", 72], ["AI对话", 94], ["巩固复盘", 24]].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-2 flex justify-between text-[12px] text-[#6B5B49]"><span>{label}</span><span>{value}%</span></div>
                  <Progress value={value} />
                </div>
              ))}
            </div>
          </Surface>
        </>
      );
    }

    if (minePage === "mistakes") {
      const mineMistakeCats = ["全部"];
      for (const it of mistakesState.items) {
        if (it?.category && !mineMistakeCats.includes(it.category)) mineMistakeCats.push(it.category);
      }
      const activeCat = mineMistakeCats.includes(mistakeFilter) ? mistakeFilter : "全部";
      const visibleItems = mistakesState.items.filter(
        (it) => activeCat === "全部" || it?.category === activeCat,
      );
      return (
        <>
          <PageHeader title="错题库" desc="按发音、释义、拼写分类复盘。" back onBack={() => setMinePage("overview")} />
          {mistakesState.items.length === 0 ? (
            <Surface className="p-5 text-center shadow-sm">
              <div className="text-[15px] font-bold text-[#2C241C]">暂无错题</div>
              <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">错题会在你做题时自动加入，目前还没有记录。</p>
            </Surface>
          ) : (
            <>
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {mineMistakeCats.map((type) => (
                  <button
                    key={type}
                    onClick={() => setMistakeFilter(type)}
                    className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${activeCat === type ? "bg-[#3A2A1A] text-white" : "bg-[#FFF8EA] text-[#6B5B49]"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {visibleItems.map((it) => (
                  <Surface key={`${it.wordId || it.word}-${it.addedAt}`} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[18px] font-bold text-[#2C241C]">{it.word}</div>
                        {it.reason ? <div className="mt-1 text-[12px] text-[#6B5B49]">{it.reason}</div> : null}
                      </div>
                      {it.action ? (
                        <button
                          onClick={() => showToast(it.action)}
                          className="shrink-0 rounded-full bg-[#FBF2DA] px-3 py-2 text-[12px] font-bold text-[#8A6324] active:scale-95"
                        >
                          {it.action}
                        </button>
                      ) : null}
                    </div>
                  </Surface>
                ))}
              </div>
            </>
          )}
        </>
      );
    }

    if (minePage === "records") {
      const filters = ["全部", "单词", "跟读", "AI对话"];
      const visibleRecords = studyRecords.filter((item) => recordFilter === "全部" || item.type === recordFilter);
      const grouped = visibleRecords.reduce((acc, item) => {
        acc[item.date] = acc[item.date] || [];
        acc[item.date].push(item);
        return acc;
      }, {});
      return (
        <>
          <PageHeader title="学习记录" desc="按日期聚合，不做流水账。" back onBack={() => setMinePage("overview")} />
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {filters.map((type) => (
              <button key={type} onClick={() => setRecordFilter(type)} className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${recordFilter === type ? "bg-[#3A2A1A] text-white" : "bg-[#FFF8EA] text-[#6B5B49]"}`}>{type}</button>
            ))}
          </div>
          <div className="space-y-5">
            {Object.entries(grouped).map(([date, items]) => (
              <section key={date}>
                <SectionTitle title={date} />
                <div className="space-y-2">
                  {items.map((item) => (
                    <Surface key={item.type + item.title} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-[#FBF2DA] px-3 py-1 text-[12px] font-bold text-[#8A6324]">{item.type}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[15px] font-bold text-[#2C241C]">{item.title}</div>
                          <div className="mt-1 text-[12px] text-[#6B5B49]">{item.desc}</div>
                        </div>
                      </div>
                    </Surface>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      );
    }

    if (minePage === "backup") {
      return (
        <>
          <PageHeader title="备份与恢复" desc="本地数据安全操作，全部需要二次确认。" back onBack={() => setMinePage("overview")} />
          <div className="space-y-3">
            {[["导出备份文件", "导出词库进度、学习记录、素材库"], ["导入备份文件", "恢复之前保存的本地备份"], ["清理音频缓存", "释放AI对话产生的音频空间"], ["重置全部数据", "清空本地学习数据，需谨慎操作"]].map(([title, desc]) => (
              <Surface key={title} className="p-4">
                <div className="text-[16px] font-bold text-[#2C241C]">{title}</div>
                <p className="mt-1 text-[13px] leading-6 text-[#6B5B49]">{desc}</p>
                <button onClick={() => showToast("二次确认后执行")} className="mt-3 rounded-[14px] bg-[#3A2A1A] px-4 py-2.5 text-[12px] font-bold text-white active:scale-95">操作</button>
              </Surface>
            ))}
          </div>
        </>
      );
    }

    if (minePage === "settings") {
      return (
        <>
          <PageHeader title="学习设置" desc="目标偏好、每日学习量、音色语速都在这里。" back onBack={() => setMinePage("overview")} />
          <div className="space-y-4">
            <Surface className="p-4">
              <div className="text-[13px] font-bold text-[#2C241C]">学习目标偏好</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {["考试提分", "口语提升", "词汇夯实", "综合学习"].map((item, index) => (
                  <button key={item} onClick={() => showToast("已切换为" + item)} className={`rounded-full px-4 py-2 text-[12px] font-bold ${index === 0 ? "bg-[#3A2A1A] text-white" : "bg-white text-[#6B5B49]"}`}>{item}</button>
                ))}
              </div>
            </Surface>
            <Surface className="p-4">
              <div className="text-[13px] font-bold text-[#2C241C]">默认语音偏好</div>
              <p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">单词与例句：统一使用标准词典发音；AI 对话：支持女声与男声。</p>
            </Surface>
            <Surface className="p-4">
              <div className="text-[13px] font-bold text-[#2C241C]">每日学习量</div>
              <p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">每天 8 个待复习词 + 1 轮口语练习</p>
            </Surface>
          </div>
        </>
      );
    }

    if (minePage === "login") {
      return (
        <>
          <PageHeader title="手机号登录" desc="登录后可同步学习进度、收藏与错题；未登录也能继续本地学习。" back onBack={() => setMinePage("overview")} />
          <Surface className="p-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#D8B65E] to-[#7A5525] text-[22px] font-bold text-white">词</div>
            <h2 className="mt-4 text-center text-[20px] font-bold text-[#2C241C]">登录词源账号</h2>
            <p className="mx-auto mt-2 max-w-xs text-center text-[13px] leading-6 text-[#6B5B49]">
              {phoneAuthMode === "mock"
                ? "当前为 mock 验证模式，不发送真实短信。"
                : "已接入真实短信登录，请输入手机收到的验证码。"}
            </p>
            <div className="mt-4 rounded-[18px] border border-[#E6D8BF] bg-[#FBF2DA] px-4 py-3 text-[12px] leading-5 text-[#8A6324]">
              {phoneAuthMode === "mock"
                ? "当前模式：mock 验证码，测试验证码固定为 123456。"
                : "当前模式：真实短信验证码，请输入手机收到的验证码。"}
            </div>
            <div className="mt-4 space-y-3">
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value.replace(/\D+/g, "").slice(0, 11))}
                placeholder="请输入手机号"
                className="w-full rounded-[16px] border border-[#E6D8BF] bg-white px-4 py-3 text-[14px] font-medium text-[#2C241C] outline-none placeholder:text-[#998B78]"
              />
              <input
                type="text"
                value={phoneNicknameInput}
                onChange={(e) => setPhoneNicknameInput(e.target.value.slice(0, 20))}
                placeholder="昵称（可选）"
                className="w-full rounded-[16px] border border-[#E6D8BF] bg-white px-4 py-3 text-[14px] font-medium text-[#2C241C] outline-none placeholder:text-[#998B78]"
              />
              <div className="flex gap-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phoneCodeInput}
                  onChange={(e) => setPhoneCodeInput(e.target.value.replace(/\D+/g, "").slice(0, 6))}
                  placeholder="验证码"
                  className="min-w-0 flex-1 rounded-[16px] border border-[#E6D8BF] bg-white px-4 py-3 text-[14px] font-medium text-[#2C241C] outline-none placeholder:text-[#998B78]"
                />
                <button onClick={handleSendPhoneCode} disabled={cloudSyncBusy} className={`shrink-0 rounded-[16px] px-4 py-3 text-[13px] font-bold text-white active:scale-[0.98] ${cloudSyncBusy ? "bg-[#C7B8A5]" : "bg-[#8A6324]"}`}>
                  发验证码
                </button>
              </div>
            </div>
            <div className="mt-5 rounded-[18px] border border-[#E6D8BF] bg-white/80 p-4">
              <div className="text-[12px] font-bold text-[#8A6324]">登录 / 同步状态</div>
              <div className="mt-2 text-[14px] font-bold text-[#2C241C]">
                {cloudSyncBusy ? "正在连接云端..." : cloudSyncNotice}
              </div>
              {loggedIn ? (
                <p className="mt-2 text-[12px] leading-5 text-[#6B5B49]">
                  已登录：{maskedPhone} · {phoneAuthState?.nickname || "词源用户"} · {phoneAuthState?.mockMode ? "mock 模式" : "短信模式"}
                </p>
              ) : (
                <p className="mt-2 text-[12px] leading-5 text-[#6B5B49]">
                  当前仍以本地学习为主。登录后可选择把本地学习进度同步到云端，云端异常时会自动降级到本地。
                </p>
              )}
            </div>
            <button
              onClick={loggedIn ? handleEnableCloudSync : handlePhoneLogin}
              disabled={cloudSyncBusy}
              className={`mt-5 w-full rounded-[16px] py-3 text-[14px] font-bold text-white active:scale-[0.98] ${
                cloudSyncBusy ? "bg-[#C7B8A5]" : "bg-[#3A2A1A]"
              }`}
            >
              {cloudSyncBusy ? "连接中..." : loggedIn ? "将本地记录重新同步到云端" : "手机号登录"}
            </button>
            {loggedIn ? (
              <button onClick={handleLogoutCloudUser} className="mt-3 w-full rounded-[16px] bg-white py-3 text-[14px] font-bold text-[#8A6324] active:scale-[0.98]">退出登录</button>
            ) : (
              <button onClick={() => setMinePage("overview")} className="mt-3 w-full rounded-[16px] bg-white py-3 text-[14px] font-bold text-[#8A6324] active:scale-[0.98]">暂不登录，继续本地使用</button>
            )}
          </Surface>
          <Surface className="mt-4 p-4">
            <div className="text-[13px] font-bold text-[#2C241C]">本地模式说明</div>
            <p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">未登录：继续使用 localStorage。本阶段登录成功后，学习进度、收藏、错题优先写云端，同时保留本地缓存作为兜底。</p>
          </Surface>
        </>
      );
    }

    return (
      <>
        <PageHeader title="我的" desc="学习记录、错题库、备份与设置。" />
        <button onClick={() => setMinePage("login")} className="mb-5 flex w-full items-center gap-4 rounded-[22px] border border-[#E6D8BF] bg-[#FFF8EA] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.06)] active:scale-[0.98]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#D8B65E] to-[#7A5525] text-[16px] font-bold text-white">词</div>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-bold text-[#2C241C]">{loggedIn ? (phoneAuthState?.nickname || "词源用户") : "本地学习档案"}</div>
            <div className="mt-1 text-[12px] text-[#6B5B49]">{loggedIn ? `${maskedPhone} · ${cloudSyncNotice}` : "手机号登录后可同步学习进度"}</div>
          </div>
          <div className="text-[12px] font-bold text-[#8A6324]">{loggedIn ? "已登录" : "登录"}</div>
        </button>
        <div className="space-y-6">
          <section>
            <SectionTitle title="收藏与错题" />
            <div className="space-y-3">
              <button
                onClick={() => { setActiveTab("words"); setTimeout(() => { setWordPage("favorites"); setFavoriteWordPackFilter("all"); setFavoriteWordSearch(""); }, 0); }}
                className="w-full rounded-[22px] border border-[#E6D8BF] bg-[#FFF8EA] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] active:scale-[0.98]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[16px] font-bold text-[#2C241C]">我的收藏单词</div>
                    <p className="mt-1 text-[13px] leading-6 text-[#6B5B49]">已收藏 {favorites.wordFavorites.length} 个单词，支持按词库筛选与搜索。</p>
                  </div>
                  <div className="shrink-0 text-[#8A6324]">›</div>
                </div>
              </button>
              <button
                onClick={() => setMinePage("mistakes")}
                className="w-full rounded-[22px] border border-[#E6D8BF] bg-[#FFF8EA] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] active:scale-[0.98]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[16px] font-bold text-[#2C241C]">错题库</div>
                    <p className="mt-1 text-[13px] leading-6 text-[#6B5B49]">标记的发音/释义/拼写错词在这里复盘。</p>
                  </div>
                  <div className="shrink-0 text-[#8A6324]">›</div>
                </div>
              </button>
            </div>
          </section>
          {mineGroups.map((group) => (
            <section key={group.title}>
              <SectionTitle title={group.title} />
              <div className="space-y-3">
                {group.items.map(([title, desc]) => {
                  const pageMap = { "学习数据": "stats", "易错词库": "mistakes", "学习记录": "records", "备份与恢复": "backup", "学习设置": "settings" };
                  return (
                    <button key={title} onClick={() => setMinePage(pageMap[title] || "overview")} className="w-full rounded-[22px] border border-[#E6D8BF] bg-[#FFF8EA] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] active:scale-[0.98]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[16px] font-bold text-[#2C241C]">{title === "易错词库" ? "错题库" : title}</div>
                          <p className="mt-1 text-[13px] leading-6 text-[#6B5B49]">{desc}</p>
                        </div>
                        <div className="shrink-0 text-[#8A6324]">›</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </>
    );
  }

  const renderActive = () => {
    if (activeTab === "home") return renderHome();
    if (activeTab === "words") return renderWords();
    if (activeTab === "training") return renderTraining();
    if (activeTab === "workbench") return renderWorkbench();
    return renderMine();
  };

  return (
    <DeviceShell
      immersiveCall={callOpen}
      tabs={tabs} activeTab={activeTab} onTab={(tab) => { setActiveTab(tab); if (tab !== "words") { setSelectedPack((p) => (p?.id === V2_FAVORITE_LEARN_PACK_ID || p?.id === V2_MISTAKE_LEARN_PACK_ID ? lastRealPackBeforeFavoriteRef.current : p)); setWordPage("list"); setFavoriteWordPackFilter("all"); setFavoriteWordSearch(""); setMistakeLibPackFilter("all"); setMistakeWordSearch(""); } if (tab !== "training") { setTrainingPage("overview"); setWritingPage("overview"); setShadowPage("overview"); } if (tab !== "mine") setMinePage("overview"); if (tab !== "workbench") setWorkbenchPage("overview"); }}>
      {renderActive()}
      {toast ? (
        <div
          className={
            callOpen
              ? "fixed bottom-[max(22px,calc(env(safe-area-inset-bottom,0px)+16px))] left-1/2 z-[70] max-w-[min(92vw,480px)] -translate-x-1/2 px-4"
              : "fixed bottom-[92px] left-1/2 z-50 max-w-[min(92vw,480px)] -translate-x-1/2 px-4"
          }
        >
          <div className="rounded-full bg-[#3A2A1A] px-5 py-3 text-[13px] font-bold leading-snug text-white text-center shadow-[0_10px_30px_rgba(0,0,0,0.18)]">{toast}</div>
        </div>
      ) : null}
    </DeviceShell>
  );
}
