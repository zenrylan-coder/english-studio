import type { ReactNode } from "react";

export type PhoneShellTab = { key: string; label: string; icon: ReactNode };

export function PhoneShell({
  children,
  activeTab,
  onTab,
  tabs,
  /** AI 自由闲聊 · 电话模式全屏时使用：隐藏外壳顶栏与底部 Tab，主区铺满 */
  immersiveCall = false,
}: {
  children: ReactNode;
  activeTab: string;
  onTab: (key: string) => void;
  tabs: PhoneShellTab[];
  immersiveCall?: boolean;
}) {
  return (
    <div className="relative min-h-screen bg-[#EEDDC7] text-[#2B2118] md:flex md:items-center md:justify-center md:px-6 md:py-10">
      <div
        className="pointer-events-none fixed inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(circle at 18% 8%, rgba(216,182,94,0.18), transparent 26%), radial-gradient(circle at 84% 20%, rgba(122,85,37,0.12), transparent 24%), linear-gradient(180deg, rgba(255,248,235,0.78), rgba(238,221,199,0.96) 52%, rgba(231,210,182,0.98))",
        }}
      />
      <div className="relative mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-[520px] flex-col overflow-hidden bg-[#F1E3CF] shadow-[0_0_60px_rgba(58,42,26,0.16)] md:mx-0 md:h-[920px] md:max-h-[920px] md:w-[460px] md:max-w-[460px] md:rounded-[36px] md:border md:border-[#E6D8BF] md:shadow-[0_20px_80px_rgba(58,42,26,0.20)]">
        {!immersiveCall ? (
          <header className="z-30 shrink-0 border-b border-[#E6D8BF] bg-[#FFF8EA]/95 px-3.5 py-1.5 backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-gradient-to-br from-[#D8B65E] to-[#7A5525] text-[12px] font-bold text-white">词</div>
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="text-[14px] font-bold text-[#1a1a1a]">词境</span>
                <span className="text-[10px] text-[#7A6B57]">从词汇到表达，从输入到开口</span>
              </div>
            </div>
          </header>
        ) : null}
        <main className={`relative z-0 min-h-0 flex-1 ${immersiveCall ? "overflow-hidden p-0" : "overflow-y-auto px-5 pt-5 pb-5"}`}>{children}</main>
        {!immersiveCall ? (
          <nav className="relative z-[100] grid w-full shrink-0 grid-cols-4 border-t border-[#E6D8BF] bg-[#FFF8EA]/96 px-2 py-2 pointer-events-auto backdrop-blur md:rounded-b-[36px]">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => onTab(tab.key)} className={`rounded-[16px] px-1 py-2 text-center transition-colors duration-200 active:scale-95 ${activeTab === tab.key ? "bg-[#3A2A1A] text-white shadow-[0_2px_8px_rgba(58,42,26,0.18)]" : "text-[#6B5B49] hover:bg-[#3A2A1A]/6"}`}>
                <div className="mx-auto flex h-5 w-5 items-center justify-center [&>svg]:h-5 [&>svg]:w-5">{tab.icon}</div>
                <div className={`mt-1 text-[11px] font-bold ${activeTab === tab.key ? "opacity-100" : "opacity-80"}`}>{tab.label}</div>
              </button>
            ))}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
