"use client";

import { useState } from "react";
import { getSaju, getGunghap, type GunghapResult, type SajuChart } from "@hap/core";

// ─────────── 상수/유틸 ───────────

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const TAG_LABEL: Record<string, string> = {
  "stem-hap": "천간합",
  "stem-same": "닮은꼴",
  "stem-gen-A": "상생",
  "stem-gen-B": "상생",
  "stem-control-A": "밀당",
  "stem-control-B": "밀당",
  "branch-yukhap": "육합",
  "branch-banhap": "반합",
  "branch-chung": "충",
  "branch-hyeong": "형",
  "branch-hae": "해",
};

function tagToLabel(tag: string): string | null {
  if (TAG_LABEL[tag]) return TAG_LABEL[tag];
  if (tag.startsWith("element-fill:")) return `${tag.split(":")[1]} 채워줌`;
  if (tag.startsWith("element-void:")) return `${tag.split(":")[1]} 공백`;
  return null;
}

/** 점수대별 헤드라인 + breakdown 최상위 근거로 만드는 결정론적 카피 (LLM 도입 전 임시) */
function makeCopy(g: GunghapResult): { headline: string; sub: string } {
  const sorted = [...g.breakdown].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const top = sorted[0];
  const headline =
    g.score >= 80 ? "이 정도면 하늘이 묶어놓은 사이" :
    g.score >= 65 ? "합이 잘 맞는 인연" :
    g.score >= 50 ? "노력하면 예쁘게 맞물리는 사이" :
    g.score >= 35 ? "쉽지 않지만, 그래서 특별한 조합" :
    "정면충돌 주의. 근데 원래 그런 게 더 짜릿하지 않나";
  const sub = top ? top.detail.split("—")[1]?.trim() ?? top.detail : "";
  return { headline, sub };
}

interface PersonForm {
  name: string;
  date: string;   // yyyy-mm-dd
  time: string;   // 'unknown' | '0'..'23'
}

function parsePerson(p: PersonForm): SajuChart {
  const [y, m, d] = p.date.split("-").map(Number);
  return getSaju({
    year: y, month: m, day: d,
    ...(p.time !== "unknown" ? { hour: Number(p.time) } : {}),
  });
}

// ─────────── 컴포넌트 ───────────

function PersonFields({
  title, value, onChange, timeRequired,
}: {
  title: string;
  value: PersonForm;
  onChange: (v: PersonForm) => void;
  timeRequired?: boolean;
}) {
  return (
    <fieldset className="rounded-2xl border border-[#F0997B]/40 bg-white/50 p-5">
      <legend className="px-2 font-serif text-lg text-[#712B13]">{title}</legend>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="이름 (애칭도 좋아요)"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className="rounded-lg border border-[#F0997B]/50 bg-white px-3 py-2 text-[#4A1B0C] placeholder:text-[#993C1D]/40 focus:outline-none focus:ring-2 focus:ring-[#D85A30]/40"
        />
        <input
          type="date"
          value={value.date}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
          className="rounded-lg border border-[#F0997B]/50 bg-white px-3 py-2 text-[#4A1B0C] focus:outline-none focus:ring-2 focus:ring-[#D85A30]/40"
        />
        <select
          value={value.time}
          onChange={(e) => onChange({ ...value, time: e.target.value })}
          className="rounded-lg border border-[#F0997B]/50 bg-white px-3 py-2 text-[#4A1B0C] focus:outline-none focus:ring-2 focus:ring-[#D85A30]/40"
        >
          <option value="unknown">{timeRequired ? "태어난 시간 선택" : "태어난 시간 몰라요"}</option>
          {HOURS.map((h) => (
            <option key={h} value={h}>{h}시 ~ {h}시 59분</option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}

export default function Home() {
  const [me, setMe] = useState<PersonForm>({ name: "", date: "", time: "unknown" });
  const [you, setYou] = useState<PersonForm>({ name: "", date: "", time: "unknown" });
  const [result, setResult] = useState<{
    g: GunghapResult; sajuA: SajuChart; sajuB: SajuChart;
  } | null>(null);
  const [error, setError] = useState("");

  const submit = () => {
    setError("");
    if (!me.date || !you.date) { setError("생년월일을 입력해주세요"); return; }
    try {
      const sajuA = parsePerson(me);
      const sajuB = parsePerson(you);
      setResult({ g: getGunghap(sajuA, sajuB), sajuA, sajuB });
    } catch (e) {
      setError(e instanceof Error ? e.message : "계산 중 문제가 생겼어요");
    }
  };

  const nameA = me.name || "나";
  const nameB = you.name || "그 사람";

  return (
    <main className="min-h-screen bg-[#FBF4EC] px-4 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="text-center font-serif text-2xl tracking-[0.5em] text-[#993C1D]">
          合 · 합
        </h1>
        <p className="mt-2 text-center text-sm text-[#993C1D]/70">
          우리, 합이 맞을까? — 생년월일로 보는 사주 궁합
        </p>

        {!result && (
          <div className="mt-8 flex flex-col gap-5">
            <PersonFields title="나" value={me} onChange={setMe} timeRequired />
            <PersonFields title="그 사람" value={you} onChange={setYou} />
            {error && <p className="text-center text-sm text-[#A32D2D]">{error}</p>}
            <button
              onClick={submit}
              className="rounded-xl bg-[#D85A30] py-3 font-serif text-lg text-[#FAECE7] transition hover:bg-[#993C1D] active:scale-[0.98]"
            >
              합 보기
            </button>
            <p className="text-center text-xs text-[#993C1D]/50">
              재미로 보는 궁합이에요. 입력한 정보는 저장되지 않아요 (MVP)
            </p>
          </div>
        )}

        {result && (() => {
          const { g, sajuA, sajuB } = result;
          const copy = makeCopy(g);
          const chips = [
            ...g.tags.map(tagToLabel).filter((v): v is string => v !== null),
            g.sipsinAtoB,
          ].slice(0, 4);

          return (
            <div className="mt-8">
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
                  &ldquo;{copy.headline}.<br />{copy.sub}&rdquo;
                </p>

                <div className="mt-6 border-t border-dashed border-[#F0997B] pt-4">
                  {["갈등 포인트", "연애 타이밍", "속궁합"].map((label) => (
                    <div key={label} className="flex items-center gap-2 py-1.5 text-sm text-[#993C1D]">
                      <span aria-hidden>🔒</span>{label}
                      <span className="ml-1 h-2 flex-1 rounded bg-[#F5C4B3]" />
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full rounded-xl bg-[#D85A30] py-2.5 text-sm text-[#FAECE7] transition hover:bg-[#993C1D]">
                  {nameB}님이 태어난 시간을 입력하면 해금
                </button>
              </div>

              <details className="mt-4 rounded-xl border border-[#F0997B]/40 bg-white/50 p-4 text-sm text-[#712B13]">
                <summary className="cursor-pointer font-serif">점수 근거 보기</summary>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {g.breakdown.map((item, i) => (
                    <li key={i}>
                      <span className={item.delta >= 0 ? "text-[#3B6D11]" : "text-[#A32D2D]"}>
                        [{item.delta >= 0 ? "+" : ""}{item.delta}]
                      </span>{" "}
                      {item.detail}
                    </li>
                  ))}
                </ul>
              </details>

              <button
                onClick={() => setResult(null)}
                className="mt-4 w-full rounded-xl border border-[#D85A30]/50 py-2.5 text-sm text-[#993C1D] transition hover:bg-[#FAECE7]"
              >
                다시 보기
              </button>
            </div>
          );
        })()}
      </div>
    </main>
  );
}
