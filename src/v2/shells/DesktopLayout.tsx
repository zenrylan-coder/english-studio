"use client";

import type { ReactNode } from "react";

import type { PhoneShellTab } from "@/components/v2/PhoneShell";

import { DesktopVisualScope } from "./desktopVisualContext";

export type DesktopLayoutProps = {
  children: ReactNode;
  tabs: PhoneShellTab[];
  activeTab: string;
  onTab: (key: string) => void;
  immersiveCall?: boolean;
};

/** Desktop shell: left navigation and centered main content only. */
export function DesktopLayout({
  children,
  tabs,
  activeTab,
  onTab,
  immersiveCall = false,
}: DesktopLayoutProps) {
  return (
    <div className="relative min-h-screen bg-[#F5EBDE] text-[#2E2418] xl:px-8 xl:py-8">
      <div
        className="pointer-events-none fixed inset-0 opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 95% 70% at 50% -8%, rgba(184,138,58,0.14), transparent 58%), radial-gradient(circle at 12% 22%, rgba(255,246,236,0.85), transparent 42%), radial-gradient(circle at 88% 18%, rgba(210,174,118,0.08), transparent 36%), linear-gradient(180deg, #FCF7EF 0%, #F8F1E8 48%, #F3EAD9 100%)",
        }}
      />

      <div className="relative mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-[1440px] overflow-hidden rounded-[30px] border border-[#C9B89A]/45 bg-[#FFF9F3]/94 shadow-[0_28px_72px_rgba(62,42,28,0.11),0_10px_28px_rgba(161,118,43,0.08)] backdrop-blur-xl">
        {!immersiveCall ? (
          <aside className="z-40 flex w-[240px] shrink-0 flex-col border-r border-[#4A3928]/80 bg-gradient-to-b from-[#1F1710] via-[#2A1D14] to-[#201910] text-[#F2EADE] backdrop-blur-xl">
            <div className="shrink-0 border-b border-[#4A3928]/90 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#E8C878] via-[#C9A24A] to-[#714F24] text-[19px] font-black leading-none text-[#FFF8E6] shadow-[inset_0_1px_0_rgba(255,255,255,0.42),inset_0_-2px_4px_rgba(60,40,18,0.22),0_8px_20px_rgba(20,14,10,0.45)] ring-1 ring-[#F0DCA0]/55 [text-shadow:0_1px_0_rgba(255,255,255,0.5),0_2px_8px_rgba(58,42,26,0.42)]">
                  词
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-bold leading-none text-[#FFFEFC] drop-shadow-[0_1px_0_rgba(0,0,0,0.22)]">
                    词源
                  </div>
                  <div className="mt-1 text-[11px] leading-5 text-[#CBB69D]">从词汇到开口的学习工作台</div>
                </div>
              </div>
            </div>

            <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTab(tab.key)}
                  className={`flex w-full items-center gap-3 rounded-[16px] px-4 py-3 text-left transition-colors duration-200 active:scale-[0.98] ${
                    activeTab === tab.key
                      ? "border border-[#C9A24A]/70 bg-[#332718] text-[#FFFDF7] shadow-[0_12px_32px_rgba(12,9,7,0.36)] ring-1 ring-[#DCC07A]/40"
                      : "border border-transparent text-[#D9CCBE] hover:border-[#5C4A39]/85 hover:bg-[#2F241B]"
                  }`}
                  aria-current={activeTab === tab.key ? "page" : undefined}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] [&>svg]:h-5 [&>svg]:w-5 ${
                      activeTab === tab.key
                        ? "border border-[#A1762B]/80 bg-[#2A2219] text-[#F4E9D9] shadow-inner shadow-black/22"
                        : "border border-[#4A3928]/80 bg-[#2A2119]/92 text-[#D4CBC0]"
                    }`}
                  >
                    {tab.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold leading-tight">{tab.label}</div>
                  </div>
                </button>
              ))}
            </nav>
          </aside>
        ) : null}

        <main
          className={`relative min-h-0 flex-1 ${
            immersiveCall ? "overflow-hidden bg-transparent p-0" : "overflow-y-auto bg-[linear-gradient(180deg,#FFF6EC_0%,#FFF4E9_52%,#FDF1E6_100%)] px-8 py-7 text-[#1E1813]"
          }`}
        >
          <DesktopVisualScope>{immersiveCall ? children : <div className="mx-auto w-full max-w-[980px]">{children}</div>}</DesktopVisualScope>
        </main>
      </div>
    </div>
  );
}
