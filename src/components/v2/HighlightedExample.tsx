import type { ReactNode } from "react";

function escapeForRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 在例句英文里高亮当前单词。
 * - 忽略大小写
 * - 仅匹配整词（\b 边界）
 * - 不破坏原句标点
 * - 用 <mark> 包裹，样式：bg-[#f5d88a] text-[#2f2418] rounded-[6px] px-1
 *
 * 不接 API、不生成新例句；example 为空时返回固定占位「例句待补」。
 */
export function highlightWordInExample(example: string, word: string): ReactNode {
  const sentence = typeof example === "string" ? example : "";
  if (!sentence.trim()) {
    return <span className="text-[#8a765f]">例句待补</span>;
  }
  const target = (word ?? "").trim();
  if (!target) return <>{sentence}</>;

  const pattern = new RegExp(`\\b(${escapeForRegExp(target)})\\b`, "gi");
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(sentence)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(sentence.slice(lastIndex, match.index));
    }
    nodes.push(
      <mark
        key={`hl-${key++}`}
        className="rounded-[6px] bg-[#f5d88a] px-1 text-[#2f2418]"
      >
        {match[0]}
      </mark>,
    );
    lastIndex = match.index + match[0].length;
    if (match[0].length === 0) {
      pattern.lastIndex += 1;
    }
  }
  if (lastIndex < sentence.length) {
    nodes.push(sentence.slice(lastIndex));
  }
  return <>{nodes}</>;
}

export function HighlightedExample({ sentence, word }: { sentence: string; word: string }) {
  return <>{highlightWordInExample(sentence, word)}</>;
}
