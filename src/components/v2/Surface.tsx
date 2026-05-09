import type { ReactNode } from "react";

export function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[22px] border border-[#E6D8BF] bg-[#FFF8EA] shadow-[0_4px_16px_rgba(58,42,26,0.06)] ${className}`}>
      {children}
    </div>
  );
}
