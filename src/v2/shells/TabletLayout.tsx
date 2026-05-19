"use client";

import type { ReactNode } from "react";

import type { PhoneShellTab } from "@/components/v2/PhoneShell";

export type TabletLayoutProps = {
  children: ReactNode;
  tabs: PhoneShellTab[];
  activeTab: string;
  onTab: (key: string) => void;
  immersiveCall?: boolean;
};

/** 平板：左侧轻导航 + 右侧主区；children 仍为 page 侧的 renderActive() + toast 等原样组合。 */
export function TabletLayout({ children, tabs, activeTab, onTab, immersiveCall = false }: TabletLayoutProps) {
  return (
    <div className="relative min-h-screen bg-[#EEDDC7] text-[#2B2118] md:px-6 md:py-8">
      <div
        className="pointer-events-none fixed inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(circle at 18% 8%, rgba(216,182,94,0.18), transparent 26%), radial-gradient(circle at 84% 20%, rgba(122,85,37,0.12), transparent 24%), linear-gradient(180deg, rgba(255,248,235,0.78), rgba(238,221,199,0.96) 52%, rgba(231,210,182,0.98))",
        }}
      />

      <div className="relative mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-[1100px] overflow-hidden rounded-[28px] border border-[#E6D8BF] bg-[#F1E3CF] shadow-[0_0_48px_rgba(58,42,26,0.14)]">
        {!immersiveCall ? (
          <aside className="relative z-[100] flex w-[92px] shrink-0 flex-col border-r border-[#E6D8BF] bg-[#FFF8EA]/96 pointer-events-auto backdrop-blur">
            <div className="flex shrink-0 justify-center border-b border-[#E6D8BF] px-2 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#D8B65E] to-[#7A5525] text-[13px] font-bold text-white">词</div>
            </div>
            <nav className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-2 py-3">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTab(tab.key)}
                  className={`flex w-full flex-col items-center rounded-[14px] px-1 py-2.5 text-center transition-colors duration-200 active:scale-[0.98] ${
                    activeTab === tab.key ? "bg-[#3A2A1A] text-white shadow-[0_2px_8px_rgba(58,42,26,0.18)]" : "text-[#6B5B49] hover:bg-[#3A2A1A]/6"
                  }`}
                  aria-current={activeTab === tab.key ? "page" : undefined}
                  aria-label={tab.label}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center [&>svg]:h-5 [&>svg]:w-5">{tab.icon}</div>
                  <span className="mt-1 max-w-[4.75rem] text-center text-[10px] font-bold leading-tight">{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        ) : null}

        <main className={`relative z-0 min-h-0 min-w-0 flex-1 ${immersiveCall ? "overflow-hidden p-0" : "overflow-y-auto px-5 pt-5 pb-5"} bg-[#F1E3CF]`}>
          {children}
        </main>
      </div>
    </div>
  );
}
