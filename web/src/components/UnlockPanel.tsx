import { useState } from "react";
import { HOURS } from "@/lib/gunghap-ui";

/** 잠금 화면: 내 시간이 없으면 그 자리에서 바로 입력 + 재계산, 상대 시간이 없으면 폼으로 돌아가 다시 입력 */
export function UnlockPanel({
  missingMine, onFixMyTime, onBackToForm, nameB,
}: {
  missingMine: boolean;
  onFixMyTime: (hour: string) => void;
  onBackToForm: () => void;
  nameB: string;
}) {
  const [hourPick, setHourPick] = useState("");

  return (
    <div className="rounded-2xl border border-[#F5C4B3] bg-[#FAECE7] p-5">
      {["갈등 포인트 심층 분석", "연애 타이밍", "속마음 궁합"].map((label) => (
        <div key={label} className="flex items-center gap-2 py-1.5 text-sm text-[#993C1D]">
          <span aria-hidden>🔒</span>{label}
          <span className="ml-1 h-2 flex-1 rounded bg-[#F5C4B3]" />
        </div>
      ))}

      {missingMine ? (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-sm text-[#712B13]">내가 태어난 시간을 입력하면 바로 열려요</p>
          <div className="flex gap-2">
            <select
              value={hourPick}
              onChange={(e) => setHourPick(e.target.value)}
              className="flex-1 rounded-lg border border-[#F0997B]/50 bg-white px-3 py-2 text-sm text-[#4A1B0C] focus:outline-none focus:ring-2 focus:ring-[#D85A30]/40"
            >
              <option value="">태어난 시간 선택</option>
              {HOURS.map((h) => (
                <option key={h} value={h}>{h}시 ~ {h}시 59분</option>
              ))}
            </select>
            <button
              onClick={() => hourPick !== "" && onFixMyTime(hourPick)}
              disabled={hourPick === ""}
              className="rounded-lg bg-[#D85A30] px-4 text-sm text-[#FAECE7] transition hover:bg-[#993C1D] disabled:opacity-40"
            >
              적용
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-sm text-[#712B13]">
            {nameB}님한테 태어난 시간을 물어본 다음, 폼으로 돌아가 입력하면 열려요
          </p>
          <button
            onClick={onBackToForm}
            className="w-full rounded-xl bg-[#D85A30] py-2.5 text-sm text-[#FAECE7] transition hover:bg-[#993C1D]"
          >
            다시 입력하러 가기
          </button>
        </div>
      )}
    </div>
  );
}
