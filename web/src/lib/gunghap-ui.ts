/** page.tsx에서 쓰는 순수 로직/타입 모음 — UI 컴포넌트와 분리 */
import { getSaju, getGunghap, type GunghapResult, type SajuChart } from "@hap/core";

export const HOURS = Array.from({ length: 24 }, (_, i) => i);

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
  "branch-wonjin": "원진",
  "branch-hyeong": "형",
  "branch-hae": "해",
  "branch-neutral": "담백",
  "tti-samhap": "찰떡 띠",
  "tti-yukhap": "띠 육합",
  "tti-chung": "띠 충",
  "tti-wonjin": "띠 원진",
};

export function tagToLabel(tag: string): string | null {
  if (TAG_LABEL[tag]) return TAG_LABEL[tag];
  if (tag.startsWith("element-fill:")) return `${tag.split(":")[1]} 채워줌`;
  if (tag.startsWith("element-void:")) return `${tag.split(":")[1]} 공백`;
  return null;
}

/** 점수대별 헤드라인 (LLM 도입 전 임시) */
export function makeHeadline(g: GunghapResult): string {
  return g.score >= 80 ? "이 정도면 하늘이 묶어놓은 사이" :
    g.score >= 65 ? "합이 잘 맞는 인연" :
    g.score >= 50 ? "노력하면 예쁘게 맞물리는 사이" :
    g.score >= 35 ? "쉽지 않지만, 그래서 특별한 조합" :
    "정면충돌 주의. 근데 원래 그런 게 더 짜릿하지 않나";
}

export interface PersonForm {
  name: string;
  date: string;   // yyyy-mm-dd
  time: string;   // 'unknown' | '0'..'23'
}

export const EMPTY_PERSON: PersonForm = { name: "", date: "", time: "unknown" };

function parsePerson(p: PersonForm): SajuChart {
  const [y, m, d] = p.date.split("-").map(Number);
  return getSaju({
    year: y, month: m, day: d,
    ...(p.time !== "unknown" ? { hour: Number(p.time) } : {}),
  });
}

export interface ResultState {
  g: GunghapResult; sajuA: SajuChart; sajuB: SajuChart; nameA: string; nameB: string;
}

export function compute(me: PersonForm, you: PersonForm): ResultState {
  const nameA = me.name.trim() || "나";
  const nameB = you.name.trim() || "그 사람";
  const sajuA = parsePerson(me);
  const sajuB = parsePerson(you);
  return { g: getGunghap(sajuA, sajuB, { a: nameA, b: nameB }), sajuA, sajuB, nameA, nameB };
}
