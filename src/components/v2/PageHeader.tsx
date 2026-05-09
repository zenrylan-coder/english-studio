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
  return (
    <div className="mb-5 flex items-start gap-3">
      {back ? (
        <button onClick={onBack} className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3A2A1A] text-white active:scale-95">‹</button>
      ) : null}
      <div className="min-w-0">
        <h1 className="text-[24px] font-bold leading-[1.25] text-[#231A12]">{title}</h1>
        <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">{desc}</p>
      </div>
    </div>
  );
}
