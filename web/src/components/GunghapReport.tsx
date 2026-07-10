import { getSaju, canUnlockDeepReport, getDeepReport } from "@hap/core";
import { Rich, TimingParagraph } from "@/components/RichText";
import { UnlockPanel } from "@/components/UnlockPanel";
import { WaitlistForm } from "@/components/WaitlistForm";
import { makeHeadline, tagToLabel, type ResultState } from "@/lib/gunghap-ui";

export function GunghapReport({
  result, onBackToForm, onFixMyTime,
}: {
  result: ResultState;
  onBackToForm: () => void;
  onFixMyTime: (hour: string) => void;
}) {
  const { g, sajuA, sajuB, nameA, nameB } = result;
  const chips = g.tags.map(tagToLabel).filter((v): v is string => v !== null).slice(0, 4);
  const good = g.breakdown.filter((i) => i.delta > 0);
  const caution = g.breakdown.filter((i) => i.delta < 0 && i.rule !== "element.fillCap");
  const neutral = g.breakdown.filter((i) => i.delta === 0);
  const unlocked = canUnlockDeepReport(sajuA, sajuB);

  return (
    <div className="mt-8 flex flex-col gap-4">
      {/* ── 점수 카드 (공유용) ── */}
      <div className="rounded-2xl border border-[#F5C4B3] bg-[#FAECE7] p-6">
        <p className="text-center text-sm text-[#712B13]">
          {nameA} <span className="text-[#D85A30]">×</span> {nameB}
        </p>
        <p className="mt-2 text-center font-serif text-6xl text-[#4A1B0C]">
          {g.score}<span className="text-2xl">점</span>
        </p>
        <p className="mt-3 text-center text-xs text-[#993C1D]">
          {sajuA.day.hangul}({sajuA.day.hanja}) 일주 × {sajuB.day.hangul}({sajuB.day.hanja}) 일주
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {chips.map((c) => (
            <span key={c} className="rounded-full bg-[#F5C4B3] px-3 py-1 text-xs text-[#4A1B0C]">
              {c}
            </span>
          ))}
        </div>
        <p className="mt-5 text-center font-serif leading-relaxed text-[#712B13]">
          &ldquo;{makeHeadline(g)}&rdquo;
        </p>
      </div>

      {/* ── 서로에게 어떤 존재인가 (십신) ── */}
      <section className="rounded-2xl border border-[#F0997B]/40 bg-white/60 p-5">
        <h2 className="font-serif text-lg text-[#712B13]">서로에게 어떤 존재일까</h2>
        <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-[#4A1B0C]">
          <p>
            <span className="font-serif text-[#D85A30]">{nameA}에게 {nameB}는 [{g.sipsinAtoB}]</span>
            <br />{g.sipsinAtoBMeaning}
          </p>
          <p>
            <span className="font-serif text-[#D85A30]">{nameB}에게 {nameA}는 [{g.sipsinBtoA}]</span>
            <br />{g.sipsinBtoAMeaning}
          </p>
        </div>
      </section>

      {/* ── 잘 맞는 부분 ── */}
      {good.length > 0 && (
        <section className="rounded-2xl border border-[#F0997B]/40 bg-white/60 p-5">
          <h2 className="font-serif text-lg text-[#3B6D11]">이 커플, 이래서 좋아요</h2>
          <div className="mt-3 flex flex-col gap-4">
            {good.map((item, i) => (
              <div key={i} className="border-l-2 border-[#3B6D11]/40 pl-3">
                <p className="font-serif text-sm text-[#712B13]">
                  {item.summary} <span className="text-[#3B6D11]">+{item.delta}</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#4A1B0C]/90">
                  <Rich text={item.detail} />
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 조심할 부분 ── */}
      {caution.length > 0 && (
        <section className="rounded-2xl border border-[#F0997B]/40 bg-white/60 p-5">
          <h2 className="font-serif text-lg text-[#A32D2D]">여기만 조심하면 돼요</h2>
          <div className="mt-3 flex flex-col gap-4">
            {caution.map((item, i) => (
              <div key={i} className="border-l-2 border-[#A32D2D]/40 pl-3">
                <p className="font-serif text-sm text-[#712B13]">
                  {item.summary} <span className="text-[#A32D2D]">{item.delta}</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#4A1B0C]/90">
                  <Rich text={item.detail} />
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 중립 풀이 ── */}
      {neutral.map((item, i) => (
        <section key={i} className="rounded-2xl border border-[#F0997B]/40 bg-white/60 p-5">
          <p className="font-serif text-sm text-[#712B13]">{item.summary}</p>
          <p className="mt-1 text-sm leading-relaxed text-[#4A1B0C]/90">
            <Rich text={item.detail} />
          </p>
        </section>
      ))}

      {/* ── 심층 리포트: 해금 or 잠금 패널 ── */}
      {unlocked ? (
        (() => {
          const report = getDeepReport(
            sajuA, sajuB, new Date().getFullYear(),
            (y) => getSaju({ year: y, month: 6, day: 15 }).year.branch,
            { a: nameA, b: nameB },
          );
          return (
            <>
              <p className="text-center text-xs text-[#993C1D]/60">
                🔓 두 분 모두 태어난 시간을 알아서 심층 리포트가 열렸어요
              </p>
              {[report.conflict, report.timing, report.intimacy].map((sec) => (
                <section key={sec.title} className="rounded-2xl border border-[#F5C4B3] bg-[#FAECE7] p-5">
                  <h2 className="font-serif text-lg text-[#712B13]">{sec.title}</h2>
                  <div className="mt-3 flex flex-col gap-3">
                    {sec.paragraphs.map((p, i) => (
                      <TimingParagraph key={i} text={p} />
                    ))}
                  </div>
                </section>
              ))}
            </>
          );
        })()
      ) : (
        <UnlockPanel
          missingMine={sajuA.hour === null}
          nameB={nameB}
          onFixMyTime={onFixMyTime}
          onBackToForm={onBackToForm}
        />
      )}

      <WaitlistForm nameA={nameA} nameB={nameB} />

      <button
        onClick={onBackToForm}
        className="w-full rounded-xl border border-[#D85A30]/50 py-2.5 text-sm text-[#993C1D] transition hover:bg-[#FAECE7]"
      >
        다시 보기
      </button>

      <p className="text-center text-xs text-[#993C1D]/50">
        재미로 보는 궁합이에요 · 중요한 결정은 두 분의 마음으로
      </p>
    </div>
  );
}
