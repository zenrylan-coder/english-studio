"use client";

import type { WordBankGroupItem } from "@/lib/v2/wordBankGroups";

export function WordUnitFilterPanel({
  groups,
  selectedIds,
  bankLabel,
  onCheckboxToggle,
  onCardClick,
  onSelectAll,
  onClearAll,
  onBack,
  onConfirm,
}: {
  groups: WordBankGroupItem[];
  selectedIds: string[];
  /** 当前词库简称，如「四级 CET4」 */
  bankLabel?: string;
  onCheckboxToggle: (id: string) => void;
  /** 点击卡片主体（非 checkbox）：单模块可直接开始学习 */
  onCardClick: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const selectedSet = new Set(selectedIds);
  const selectedWordCount = (() => {
    const lemmas = new Set<string>();
    for (const g of groups) {
      if (!selectedSet.has(g.id)) continue;
      for (const w of g.words) {
        const k = String(w ?? "").trim().toLowerCase();
        if (k) lemmas.add(k);
      }
    }
    return lemmas.size;
  })();

  const listMatch = (title: string) => {
    const m = title.match(/Word List\s*(\d+)/i);
    return m ? `Word List ${m[1]}` : title;
  };

  const canConfirm = selectedIds.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-[#E6D8BF] bg-[#FFF8EA]">
      <div className="shrink-0 border-b border-[#E6D8BF] bg-[#FFFDF7] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3A2A1A] text-[18px] font-bold leading-none text-white active:scale-95"
            aria-label="返回"
          >
            ‹
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-bold text-[#2C241C]">按单元筛选</h2>
            {bankLabel ? <p className="mt-0.5 text-[12px] font-medium text-[#998B78]">{bankLabel} · Word List</p> : null}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E6D8BF]/80 bg-[#FBF2DA]/60 px-4 py-2.5">
        <span className="text-[13px] font-bold text-[#8A6324]">已选 {selectedWordCount} 词</span>
        <button type="button" onClick={onSelectAll} className="text-[13px] font-bold text-[#8A6324] active:opacity-70">
          全选
        </button>
      </div>

      <div className="flex shrink-0 gap-2 border-b border-[#E6D8BF]/80 bg-[#FFFDF7] px-4 py-2.5">
        <button
          type="button"
          disabled={!canConfirm}
          onClick={onClearAll}
          className="flex-1 rounded-[12px] border border-[#E6D8BF] bg-white py-2.5 text-[13px] font-bold text-[#998B78] active:scale-[0.98] disabled:border-[#EDE4D4] disabled:bg-[#FAF6EE] disabled:text-[#C7B8A5]"
        >
          清除选择
        </button>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={onConfirm}
          className="flex-1 rounded-[12px] bg-[#3A2A1A] py-2.5 text-[13px] font-bold text-white shadow-[0_4px_12px_rgba(58,42,26,0.15)] active:scale-[0.98] disabled:bg-[#C7B8A5] disabled:text-white/80 disabled:shadow-none"
        >
          开始学习
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2">
        <ul className="space-y-2">
          {groups.map((g) => {
            const checked = selectedSet.has(g.id);
            return (
              <li key={g.id}>
                <div
                  className={`flex w-full items-center gap-3 rounded-[16px] border px-3 py-3 transition ${
                    checked ? "border-[#D8B65E] bg-white shadow-sm" : "border-[#E6D8BF] bg-[#FFFDF7]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCheckboxToggle(g.id);
                    }}
                    className="flex shrink-0 items-center justify-center active:scale-95"
                    aria-label={checked ? `取消选择 ${g.title}` : `选择 ${g.title}`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-[6px] border-2 ${
                        checked ? "border-[#8A6324] bg-[#8A6324] text-white" : "border-[#C9B89A] bg-white"
                      }`}
                      aria-hidden
                    >
                      {checked ? "✓" : ""}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onCardClick(g.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left active:opacity-80"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-bold text-[#2C241C]">{g.level}</div>
                      <div className="mt-0.5 text-[12px] text-[#998B78]">
                        {listMatch(g.title)} · {g.count} 词
                      </div>
                    </div>
                    <span className="shrink-0 text-[#8A6324]">›</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
