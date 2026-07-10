import { useState } from "react";

/**
 * 관심 신호 수집 폼. Formspree(무료, 서버 코드 불필요)로 제출.
 * NEXT_PUBLIC_FORMSPREE_ENDPOINT 환경변수에 폼 엔드포인트를 넣어야 동작한다.
 * (예: https://formspree.io/f/abcdwxyz)
 */
export function WaitlistForm({ nameA, nameB }: { nameA: string; nameB: string }) {
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const endpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;

  const submit = async () => {
    if (!contact.trim()) return;
    if (!endpoint) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: contact.trim(),
          context: `${nameA} x ${nameB} 궁합 결과에서 신청`,
        }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-[#F5C4B3] bg-white/60 p-5 text-center">
        <p className="font-serif text-sm text-[#712B13]">등록 완료! 나오면 제일 먼저 알려드릴게요 🙌</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#F0997B]/40 bg-white/60 p-5">
      <h2 className="font-serif text-lg text-[#712B13]">
        사주 기반 블라인드 소개팅, 나오면 관심 있으신가요?
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-[#4A1B0C]/80">
        얼굴이나 스펙 대신 궁합만 보고 시작하는 소개팅을 준비 중이에요. 연락처(이메일/카카오톡 ID)만 남겨주시면
        오픈했을 때 제일 먼저 알려드려요.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          placeholder="이메일 또는 카카오톡 ID"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="flex-1 rounded-lg border border-[#F0997B]/50 bg-white px-3 py-2 text-sm text-[#4A1B0C] placeholder:text-[#993C1D]/40 focus:outline-none focus:ring-2 focus:ring-[#D85A30]/40"
        />
        <button
          onClick={submit}
          disabled={status === "sending" || !contact.trim()}
          className="rounded-lg bg-[#D85A30] px-4 text-sm text-[#FAECE7] transition hover:bg-[#993C1D] disabled:opacity-40"
        >
          {status === "sending" ? "등록 중..." : "등록"}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-xs text-[#A32D2D]">
          {endpoint ? "제출 중 문제가 생겼어요, 잠시 후 다시 시도해주세요" : "등록 폼이 아직 준비 중이에요"}
        </p>
      )}
    </div>
  );
}
