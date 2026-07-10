/**
 * 궁합 규칙 모듈 — hap의 핵심 자산
 *
 * 두 명식(SajuChart)을 받아 궁합 점수와 관계 해석 재료를 계산한다.
 * 점수는 100% 결정론적 규칙 기반 (LLM은 이 출력을 받아 카피만 생성).
 *
 * 규칙 우선순위 (가중치 순):
 *  1. 일간(日干) 관계 — 두 사람의 '나' 글자끼리의 관계. 천간합 > 상생 > 비화 > 상극
 *  2. 일지(日支) 관계 — 배우자궁끼리의 관계. 육합 > 반합 > 충 > 형 > 해
 *  3. 오행 상보성 — 내게 없는 오행을 상대가 채워주는가
 *  4. 십신(十神) — 상대가 나에게 어떤 존재인가 (점수보다 카피 재료 목적)
 */
import type { Element, Pillar, SajuChart } from './manse';

// ───────────────────────── 기초 테이블 ─────────────────────────

/** 오행 상생: key가 value를 생(生)한다 */
const GENERATES: Record<Element, Element> = {
  목: '화', 화: '토', 토: '금', 금: '수', 수: '목',
};

/** 오행 상극: key가 value를 극(剋)한다 */
const CONTROLS: Record<Element, Element> = {
  목: '토', 토: '수', 수: '화', 화: '금', 금: '목',
};

/** 천간 음양 (true = 양간) */
const STEM_YANG: Record<string, boolean> = {
  甲: true, 乙: false, 丙: true, 丁: false, 戊: true,
  己: false, 庚: true, 辛: false, 壬: true, 癸: false,
};

/** 천간합 5쌍 (합화 오행 포함) */
const STEM_HAP: Array<{ pair: [string, string]; into: Element }> = [
  { pair: ['甲', '己'], into: '토' },
  { pair: ['乙', '庚'], into: '금' },
  { pair: ['丙', '辛'], into: '수' },
  { pair: ['丁', '壬'], into: '목' },
  { pair: ['戊', '癸'], into: '화' },
];

/** 지지 육합 6쌍 */
const BRANCH_YUKHAP: Array<[string, string]> = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
];

/** 삼합국: 같은 국에 속한 두 지지는 반합 */
const SAMHAP_GROUPS: Array<{ branches: string[]; into: Element }> = [
  { branches: ['申', '子', '辰'], into: '수' },
  { branches: ['亥', '卯', '未'], into: '목' },
  { branches: ['寅', '午', '戌'], into: '화' },
  { branches: ['巳', '酉', '丑'], into: '금' },
];

/** 지지 충 6쌍 */
const BRANCH_CHUNG: Array<[string, string]> = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
];

/** 지지 형 (상형·삼형의 2자 조합, 자형) */
const BRANCH_HYEONG: Array<[string, string]> = [
  ['寅', '巳'], ['巳', '申'], ['寅', '申'],
  ['丑', '戌'], ['戌', '未'], ['丑', '未'],
  ['子', '卯'],
  ['辰', '辰'], ['午', '午'], ['酉', '酉'], ['亥', '亥'],
];

/** 지지 해 6쌍 */
const BRANCH_HAE: Array<[string, string]> = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
];

export type Sipsin =
  | '비견' | '겁재' | '식신' | '상관' | '편재'
  | '정재' | '편관' | '정관' | '편인' | '정인';

// ───────────────────────── 결과 타입 ─────────────────────────

export interface ScoreItem {
  /** 규칙 식별자 (예: 'ilgan.hap', 'ilji.chung') */
  rule: string;
  /** 사람이 읽을 수 있는 설명 — LLM 카피 생성의 근거 재료 */
  detail: string;
  /** 점수 증감 */
  delta: number;
}

export interface GunghapResult {
  /** 최종 점수 0-100 */
  score: number;
  /** 점수 산출 근거 (정밀 리포트의 뼈대) */
  breakdown: ScoreItem[];
  /** A에게 B는 어떤 존재인가 */
  sipsinAtoB: Sipsin;
  /** B에게 A는 어떤 존재인가 */
  sipsinBtoA: Sipsin;
  /** 카피 생성용 관계 태그 (예: 'stem-hap', 'branch-chung', 'element-fill:금') */
  tags: string[];
}

// ───────────────────────── 내부 유틸 ─────────────────────────

function pairMatch(list: Array<[string, string]>, a: string, b: string): boolean {
  return list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** other가 me에게 어떤 십신인가 */
export function getSipsin(me: Pillar, other: Pillar): Sipsin {
  const samePolarity = STEM_YANG[me.stem] === STEM_YANG[other.stem];
  const mine = me.stemElement;
  const yours = other.stemElement;

  if (mine === yours) return samePolarity ? '비견' : '겁재';
  if (GENERATES[mine] === yours) return samePolarity ? '식신' : '상관';
  if (CONTROLS[mine] === yours) return samePolarity ? '편재' : '정재';
  if (CONTROLS[yours] === mine) return samePolarity ? '편관' : '정관';
  return samePolarity ? '편인' : '정인';
}

// ───────────────────────── 규칙 평가 ─────────────────────────

const BASE_SCORE = 50;

function evalIlgan(a: Pillar, b: Pillar, items: ScoreItem[], tags: string[]): void {
  const hap = STEM_HAP.find(
    ({ pair: [x, y] }) => (x === a.stem && y === b.stem) || (x === b.stem && y === a.stem),
  );
  if (hap) {
    items.push({
      rule: 'ilgan.hap',
      detail: `일간 천간합 ${a.stem}${b.stem} — 서로를 강하게 끌어당기는 조합 (합화 ${hap.into})`,
      delta: 18,
    });
    tags.push('stem-hap');
    return;
  }
  if (a.stemElement === b.stemElement) {
    items.push({
      rule: 'ilgan.bihwa',
      detail: `일간 비화 (${a.stemElement}·${b.stemElement}) — 닮은꼴, 친구 같은 관계`,
      delta: 5,
    });
    tags.push('stem-same');
    return;
  }
  const aGenB = GENERATES[a.stemElement] === b.stemElement;
  const bGenA = GENERATES[b.stemElement] === a.stemElement;
  if (aGenB || bGenA) {
    const giver = aGenB ? 'A' : 'B';
    items.push({
      rule: 'ilgan.sangsaeng',
      detail: `일간 상생 (${giver}가 상대를 생함) — 한쪽이 기꺼이 밀어주는 흐름`,
      delta: 10,
    });
    tags.push(`stem-gen-${giver}`);
    return;
  }
  const controller = CONTROLS[a.stemElement] === b.stemElement ? 'A' : 'B';
  items.push({
    rule: 'ilgan.sanggeuk',
    detail: `일간 상극 (${controller}가 상대를 극함) — 긴장감 있는 관계, 주도권 구도`,
    delta: -8,
  });
  tags.push(`stem-control-${controller}`);
}

function evalIlji(a: Pillar, b: Pillar, items: ScoreItem[], tags: string[]): void {
  const ab: [string, string] = [a.branch, b.branch];

  if (pairMatch(BRANCH_YUKHAP, ...ab)) {
    items.push({
      rule: 'ilji.yukhap',
      detail: `일지 육합 ${a.branch}${b.branch} — 배우자궁이 서로 묶이는 인연`,
      delta: 15,
    });
    tags.push('branch-yukhap');
  } else {
    const samhap = SAMHAP_GROUPS.find(
      (g) => g.branches.includes(a.branch) && g.branches.includes(b.branch) && a.branch !== b.branch,
    );
    if (samhap) {
      items.push({
        rule: 'ilji.banhap',
        detail: `일지 반합 (${samhap.into}국) — 같은 방향을 보는 자연스러운 합`,
        delta: 10,
      });
      tags.push('branch-banhap');
    }
  }

  if (pairMatch(BRANCH_CHUNG, ...ab)) {
    items.push({
      rule: 'ilji.chung',
      detail: `일지 충 ${a.branch}${b.branch} — 부딪히며 변화를 만드는 관계, 권태는 없음`,
      delta: -15,
    });
    tags.push('branch-chung');
  }
  if (pairMatch(BRANCH_HYEONG, ...ab)) {
    items.push({
      rule: 'ilji.hyeong',
      detail: `일지 형 — 서로를 다듬는 과정에서 마찰이 생기는 조합`,
      delta: -8,
    });
    tags.push('branch-hyeong');
  }
  if (pairMatch(BRANCH_HAE, ...ab)) {
    items.push({
      rule: 'ilji.hae',
      detail: `일지 해 — 은근히 어긋나는 타이밍, 사소한 오해 주의`,
      delta: -5,
    });
    tags.push('branch-hae');
  }
}

function evalElementFill(
  a: SajuChart, b: SajuChart, items: ScoreItem[], tags: string[],
): void {
  const elements: Element[] = ['목', '화', '토', '금', '수'];
  let fillBonus = 0;

  for (const el of elements) {
    const aMissing = a.elementCount[el] === 0;
    const bMissing = b.elementCount[el] === 0;

    if (aMissing && b.elementCount[el] >= 2) {
      fillBonus += 4;
      tags.push(`element-fill:${el}`);
      items.push({
        rule: 'element.fill',
        detail: `A에게 없는 ${el} 기운을 B가 채워줌 — 서로의 결핍을 메우는 상보성`,
        delta: 4,
      });
    }
    if (bMissing && a.elementCount[el] >= 2) {
      fillBonus += 4;
      tags.push(`element-fill:${el}`);
      items.push({
        rule: 'element.fill',
        detail: `B에게 없는 ${el} 기운을 A가 채워줌 — 서로의 결핍을 메우는 상보성`,
        delta: 4,
      });
    }
    if (aMissing && bMissing) {
      items.push({
        rule: 'element.bothMissing',
        detail: `둘 다 ${el} 기운이 없음 — 같은 약점을 공유하는 조합`,
        delta: -3,
      });
      tags.push(`element-void:${el}`);
    }
  }

  if (fillBonus > 12) {
    items.push({
      rule: 'element.fillCap',
      detail: '오행 상보 보너스 상한 적용',
      delta: -(fillBonus - 12),
    });
  }
}

// ───────────────────────── 공개 API ─────────────────────────

/**
 * 두 명식의 궁합을 계산한다. 인자 순서에 무관하게 대칭적인 결과를 보장한다
 * (십신 방향 표기는 제외 — sipsinAtoB/BtoA로 구분).
 */
export function getGunghap(a: SajuChart, b: SajuChart): GunghapResult {
  const items: ScoreItem[] = [];
  const tags: string[] = [];

  evalIlgan(a.day, b.day, items, tags);
  evalIlji(a.day, b.day, items, tags);
  evalElementFill(a, b, items, tags);

  const raw = BASE_SCORE + items.reduce((sum, i) => sum + i.delta, 0);
  const score = Math.max(0, Math.min(100, raw));

  return {
    score,
    breakdown: items,
    sipsinAtoB: getSipsin(a.day, b.day),
    sipsinBtoA: getSipsin(b.day, a.day),
    tags,
  };
}
