import type { ReactNode } from "react";

export type PhoneShellTab = { key: string; label: string; icon: string };

export function PhoneShell({
  children,
  activeTab,
  onTab,
  tabs,
}: {
  children: ReactNode;
  activeTab: string;
  onTab: (key: string) => void;
  tabs: PhoneShellTab[];
}) {
  return (
    <div className="min-h-screen bg-[#EEDDC7] text-[#2B2118]">
      <div className="pointer-events-none fixed inset-0 opacity-80" style={{ background: "radial-gradient(circle at 16% 4%, rgba(216,182,94,0.18), transparent 30%), linear-gradient(180deg, rgba(255,248,235,0.72), transparent 42%)" }} />
      <div className="relative mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-[520px] flex-col overflow-hidden bg-[#F1E3CF] shadow-[0_0_60px_rgba(58,42,26,0.16)] md:my-6 md:h-[920px] md:max-h-[920px] md:rounded-[36px] md:border md:border-[#E6D8BF]">
        <header className="z-30 shrink-0 border-b border-[#E6D8BF] bg-[#FFF8EA]/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#D8B65E] to-[#7A5525] text-[18px] font-bold text-white">词</div>
            <div>
              <div className="text-[18px] font-bold text-[#1a1a1a]">词境</div>
              <div className="text-[12px] text-[#766652]">从词汇到表达，从输入到开口</div>
            </div>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-5">{children}</main>
        <nav className="z-40 grid w-full shrink-0 grid-cols-5 border-t border-[#E6D8BF] bg-[#FFF8EA]/96 px-2 py-2 backdrop-blur md:rounded-b-[36px]">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => onTab(tab.key)} className={`rounded-[16px] px-1 py-2 text-center transition active:scale-95 ${activeTab === tab.key ? "bg-[#3A2A1A] text-white" : "text-[#6B5B49]"}`}>
              <div className="text-[16px] font-bold leading-none">{tab.icon}</div>
              <div className="mt-1 text-[11px] font-bold">{tab.label}</div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
