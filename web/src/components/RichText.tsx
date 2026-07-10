/** core가 마킹한 **...** 강조 구간을 하이라이트로 렌더링 */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1
          ? <strong key={i} className="font-semibold text-[#B4451F] bg-[#F5C4B3]/40 rounded px-0.5">{p}</strong>
          : <span key={i}>{p}</span>,
      )}
    </>
  );
}

/** 연애 타이밍 문단: "YYYY년 — ..." 형식이면 연도 배지로 구조화 */
export function TimingParagraph({ text }: { text: string }) {
  const m = text.match(/^(\d{4})년 — ([\s\S]*)$/);
  if (!m) {
    return <p className="text-sm leading-relaxed text-[#4A1B0C]/90"><Rich text={text} /></p>;
  }
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 h-fit shrink-0 rounded-lg bg-[#712B13] px-2 py-1 font-serif text-xs text-[#FAECE7]">
        {m[1]}
      </span>
      <p className="text-sm leading-relaxed text-[#4A1B0C]/90"><Rich text={m[2]} /></p>
    </div>
  );
}
