export function GroupHeader({
  title,
  count,
  open,
  onClick,
}: {
  title: string;
  count: number;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="mb-3 flex w-full items-center justify-between rounded-[14px] px-1 py-1 text-left active:scale-[0.99]">
      <div>
        <div className="text-[14px] font-bold text-[#7A6B57]">{title}</div>
        <div className="mt-0.5 text-[11px] text-[#998B78]">{count} 个词库</div>
      </div>
      <div className="rounded-full bg-[#FFF8EA] px-3 py-1 text-[12px] font-bold text-[#8A6324]">{open ? "收起" : "展开"}</div>
    </button>
  );
}
