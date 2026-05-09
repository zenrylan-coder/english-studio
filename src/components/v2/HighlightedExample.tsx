export function HighlightedExample({ sentence, word }: { sentence: string; word: string }) {
  const parts = sentence.split(new RegExp(`(${word})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === word.toLowerCase() ? (
          <span key={index} className="font-bold text-[#8A6324] underline decoration-[#D8B65E] underline-offset-4">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}
