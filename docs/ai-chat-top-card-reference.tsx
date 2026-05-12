/**
 * Design reference only — not imported by the app.
 * Live implementation: `src/app/v2/page.tsx` → `renderAIVoice`.
 */
export default function AiChatTopCardReference() {
  const scenario = "自由聊天";
  const voice = "女声";
  const speed = "标准";
  const subtitlesOn = true;
  const setCallOpen = () => {};
  const setHistoryOpen = () => {};
  const setSubtitlesOn = (_: (v: boolean) => boolean) => {};
  const setSettingsOpen = () => {};

  return (
    <section className="mx-4 mt-4 rounded-[32px] bg-[#3b2818] px-5 py-6 text-white shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-black text-[#f5d88a]">
            <span>{scenario}</span>
            <span>·</span>
            <span>{voice}</span>
            <span>·</span>
            <span>{speed}</span>
          </div>

          <h2 className="max-w-[210px] text-[30px] font-black leading-[1.12] tracking-[-0.04em] text-white">
            AI 英语自由闲聊
          </h2>

          <p className="mt-4 max-w-[230px] text-[15px] font-bold leading-7 text-[#e8d8bd]">
            不用做任务，想说什么就说什么。
          </p>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setCallOpen()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg text-[#f5d88a] active:scale-95"
            aria-label="电话模式"
          >
            📞
          </button>

          <button
            type="button"
            onClick={() => setHistoryOpen()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg text-[#f5d88a] active:scale-95"
            aria-label="历史记录"
          >
            📝
          </button>

          <button
            type="button"
            onClick={() => setSubtitlesOn((v) => !v)}
            className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-black active:scale-95 ${
              subtitlesOn
                ? "bg-[#d1a53d] text-[#2f2418]"
                : "bg-white/10 text-[#f5d88a]"
            }`}
            aria-label="字幕开关"
          >
            abc
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg text-[#f5d88a] active:scale-95"
            aria-label="设置"
          >
            ⚙️
          </button>
        </div>
      </div>
    </section>
  );
}
