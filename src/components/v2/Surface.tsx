"use client";

import type { ReactNode } from "react";

import { useInsideDesktopVisualScope } from "@/v2/shells/desktopVisualContext";

export function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  const desktopShell = useInsideDesktopVisualScope();
  const base = desktopShell
    ? // Desktop: cleaner cream, gold-taupe rim, softer warm shadows (scoped via DesktopLayout provider only)
      "rounded-[22px] border border-[#D4BF9F]/92 bg-[#FFFDF7] shadow-[0_10px_36px_rgba(72,54,38,0.08),0_3px_12px_rgba(161,118,43,0.07)]"
    : // Mobile / tablet unchanged
      "rounded-[22px] border border-[#E6D8BF] bg-[#FFF8EA] shadow-[0_4px_16px_rgba(58,42,26,0.06)]";

  return <div className={`${base} ${className}`}>{children}</div>;
}
