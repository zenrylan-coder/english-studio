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
    : "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3A2A1A] text-white active:scale-95";
  const titleClass = desktopShell
    ? "text-[26px] font-bold leading-[1.22] tracking-[-0.02em] text-[#17110C]"
    : "text-[24px] font-bold leading-[1.25] text-[#231A12]";
  const descClass = desktopShell ? "mt-2 text-[13px] leading-6 text-[#594737]" : "mt-2 text-[13px] leading-6 text-[#6B5B49]";

  return (
    <div className="mb-5 flex items-start gap-3">
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
