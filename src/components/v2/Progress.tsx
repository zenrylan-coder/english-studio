export function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#F1E4CB]">
      <div className="h-full rounded-full bg-gradient-to-r from-[#D8B65E] to-[#B8872E]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
