"use client";

import { useState } from "react";
import { PersonFields } from "@/components/PersonFields";
import { GunghapReport } from "@/components/GunghapReport";
import { compute, EMPTY_PERSON, type PersonForm, type ResultState } from "@/lib/gunghap-ui";

export default function Home() {
  const [me, setMe] = useState<PersonForm>(EMPTY_PERSON);
  const [you, setYou] = useState<PersonForm>(EMPTY_PERSON);
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState("");

  const submit = () => {
    setError("");
    if (!me.date || !you.date) { setError("생년월일을 입력해주세요"); return; }
    try {
      setResult(compute(me, you));
    } catch (e) {
      setError(e instanceof Error ? e.message : "계산 중 문제가 생겼어요");
    }
  };

  const fixMyTime = (hour: string) => {
    const updatedMe = { ...me, time: hour };
    setMe(updatedMe);
    try {
      setResult(compute(updatedMe, you));
    } catch {
      // 무시: 기존 결과 유지
    }
  };

  const reset = () => {
    setMe(EMPTY_PERSON);
    setYou(EMPTY_PERSON);
    setResult(null);
    setError("");
  };

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
            {(me.name || me.date || you.name || you.date) && (
              <button
                onClick={reset}
                className="text-center text-xs text-[#993C1D]/60 underline underline-offset-2 hover:text-[#993C1D]"
              >
                입력한 내용 초기화
              </button>
            )}
            <p className="text-center text-xs text-[#993C1D]/50">
              재미로 보는 궁합이에요. 입력한 정보는 저장되지 않아요 (MVP)
            </p>
          </div>
        )}

        {result && (
          <GunghapReport result={result} onBackToForm={() => setResult(null)} onFixMyTime={fixMyTime} />
        )}
      </div>
    </main>
  );
}
