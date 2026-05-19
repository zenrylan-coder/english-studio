/**
 * 词库分组（Word List / 单元）静态数据加载。
 * 数据位于 public/data/v2/word-bank-groups/{bankId}.json
 */

export type WordBankGroupItem = {
  id: string;
  title: string;
  level: string;
  count: number;
  words: string[];
};

export type WordBankGroupsDoc = {
  bankId: string;
  groups: WordBankGroupItem[];
};

/** pack.id（wordData）→ 分组 JSON 文件名 bankId */
export const PACK_ID_TO_BANK_ID: Record<string, string> = {
  cet4: "cet4",
  cet6: "cet6",
  kaoyan: "kaoyan",
  zsb: "zhuanshengben",
  ielts: "ielts",
};

/** 从词包卡片解析 bankId（优先 pack.id，其次显示名） */
export function resolveBankIdForPack(pack: { id?: string; name?: string } | null | undefined): string | null {
  if (!pack) return null;
  const byPackId = pack.id ? PACK_ID_TO_BANK_ID[pack.id] : null;
  if (byPackId) return byPackId;
  // 与 wordBankLoader.LABEL_TO_BANK_ID 对齐的显示名
  const byName: Record<string, string> = {
    大学英语四级: "cet4",
    大学英语六级: "cet6",
    考研英语: "kaoyan",
    专升本英语: "zhuanshengben",
    雅思英语: "ielts",
  };
  return byName[pack.name ?? ""] ?? null;
}

export function bankDisplayLabel(bankId: string): string {
  const map: Record<string, string> = {
    cet4: "四级 CET4",
    cet6: "六级 CET6",
    kaoyan: "考研",
    zhuanshengben: "专升本",
    ielts: "雅思 IELTS",
  };
  return map[bankId] ?? bankId;
}

const cache = new Map<string, WordBankGroupsDoc | null>();

export async function loadWordBankGroups(bankId: string): Promise<WordBankGroupsDoc | null> {
  if (!bankId) return null;
  if (cache.has(bankId)) return cache.get(bankId) ?? null;

  try {
    const res = await fetch(`/data/v2/word-bank-groups/${bankId}.json`, { cache: "force-cache" });
    if (!res.ok) {
      cache.set(bankId, null);
      return null;
    }
    const data = (await res.json()) as WordBankGroupsDoc;
    if (!data?.groups?.length) {
      cache.set(bankId, null);
      return null;
    }
    cache.set(bankId, data);
    return data;
  } catch {
    cache.set(bankId, null);
    return null;
  }
}

/** 选中分组 id → 允许学习的 lemma 集合（小写） */
export function lemmasFromSelectedGroups(doc: WordBankGroupsDoc | null, groupIds: string[]): Set<string> {
  const out = new Set<string>();
  if (!doc || !groupIds.length) return out;
  const idSet = new Set(groupIds);
  for (const g of doc.groups) {
    if (!idSet.has(g.id)) continue;
    for (const w of g.words) {
      const k = String(w ?? "").trim().toLowerCase();
      if (k) out.add(k);
    }
  }
  return out;
}

export function countWordsInGroups(doc: WordBankGroupsDoc | null, groupIds: string[]): number {
  return lemmasFromSelectedGroups(doc, groupIds).size;
}
