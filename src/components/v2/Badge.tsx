import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-[#FBF2DA] px-3 py-1 text-[12px] font-bold text-[#8A6324]">{children}</span>;
}
