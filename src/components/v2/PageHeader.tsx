"use client";

import { useInsideDesktopVisualScope } from "@/v2/shells/desktopVisualContext";

export function PageHeader({
  title,
  desc,
  back,
  onBack,
}: {
  title: string;
  desc: string;
  back?: boolean;
  onBack?: () => void;
}) {
  const desktopShell = useInsideDesktopVisualScope();
  const backClass = desktopShell
    ? "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#35291E] text-[#FFF8EE] shadow-[0_8px_20px_rgba(40,26,14,0.25)] ring-2 ring-[#B88A3A]/45 hover:bg-[#3D301F] active:scale-95"
    : "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3A2A1A] text-white active:scale-95 md:mt-1 md:h-10 md:w-10";
  const titleClass = desktopShell
    ? "text-[26px] font-bold leading-[1.22] tracking-[-0.02em] text-[#17110C]"
    : "text-[20px] font-bold leading-[1.2] text-[#231A12] md:text-[24px] md:leading-[1.25]";
  const descClass = desktopShell ? "mt-2 text-[13px] leading-6 text-[#594737]" : "mt-1 text-[12px] leading-5 text-[#6B5B49] md:mt-2 md:text-[13px] md:leading-6";

  return (
    <div className="mb-3 flex items-start gap-2.5 md:mb-5 md:gap-3">
      {back ? (
        <button type="button" onClick={onBack} className={backClass}>
          ‹
        </button>
      ) : null}
      <div className="min-w-0">
        <h1 className={titleClass}>{title}</h1>
        <p className={descClass}>{desc}</p>
      </div>
    </div>
  );
}
