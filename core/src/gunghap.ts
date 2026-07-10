/**
 * 궁합 규칙 모듈 — hap의 핵심 자산
 *
 * 두 명식(SajuChart)을 받아 궁합 점수와 관계 해석 재료를 계산한다.
 * 점수는 100% 결정론적 규칙 기반 (LLM은 이 출력을 받아 카피만 생성).
 *
 * 각 규칙은 3단 풀이를 함께 반환한다:
 *  - summary: 카드에 노출되는 한 줄
 *  - detail : 펼침 영역용 상세 풀이 (2~3문장, 유저에게 직접 노출)
 *  - fact   : LLM 프롬프트용 건조한 사실 서술
 *
 * 규칙 목록 (가중치 순):
 *  1. 일간(日干) 관계 — 두 사람의 '나' 글자. 천간합 > 상생 > 비화 > 상극
 *  2. 일지(日支) 관계 — 배우자궁. 육합 > 반합 > 충 > 원진 > 형 > 해
 *  3. 년지(年支) 관계 — 띠 궁합. 삼합 > 육합 > 충 > 원진 (가중치 낮음)
 *  4. 오행 상보성 — 내게 없는 오행을 상대가 채워주는가
 *  5. 십신(十神) — 상대가 나에게 어떤 존재인가 (의미 사전 포함)
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

/** 지지 원진 6쌍 */
const BRANCH_WONJIN: Array<[string, string]> = [
  ['子', '未'], ['丑', '午'], ['寅', '酉'], ['卯', '申'], ['辰', '亥'], ['巳', '戌'],
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

/** 지지 → 띠 이름 */
const BRANCH_TTI: Record<string, string> = {
  子: '쥐', 丑: '소', 寅: '호랑이', 卯: '토끼', 辰: '용', 巳: '뱀',
  午: '말', 未: '양', 申: '원숭이', 酉: '닭', 戌: '개', 亥: '돼지',
};

export type Sipsin =
  | '비견' | '겁재' | '식신' | '상관' | '편재'
  | '정재' | '편관' | '정관' | '편인' | '정인';

/** 십신별 연애 관점 의미 사전 — "상대가 나에게 [십신]"일 때의 해석 */
export const SIPSIN_MEANING: Record<Sipsin, string> = {
  비견: '나와 어깨를 나란히 하는 사람. 친구처럼 편하고 대등한데, 한번 자존심 싸움이 붙으면 둘 다 안 굽혀서 길어져요.',
  겁재: '닮았는데 묘하게 승부욕을 자극하는 사람. 밀당이 저절로 생기는 관계라 지루할 틈은 없어요.',
  식신: '내가 챙겨주고 싶어지는 사람. 같이 있으면 말이 많아지고 마음이 느슨하게 풀려요.',
  상관: '내 끼와 말문을 터뜨리는 사람. 제일 재밌는 상대인데, 가끔 선 넘는 농담이 튀어나올 수 있어요.',
  편재: '자꾸 눈이 가고, 갖고 싶어지는 사람. 설렘이 큰 만큼 소유욕도 같이 커지는 타입이에요.',
  정재: '안정감을 주는, 내 사람으로 만들고 싶은 상대. 불꽃보다는 오래 타는 장작 같은 관계예요.',
  편관: '나를 긴장시키는 사람. 같이 있으면 괜히 자세를 고쳐 앉게 되는, 어려운데 자꾸 신경 쓰이는 존재예요.',
  정관: '나를 반듯하게 만드는 사람. 옆에 있으면 더 나은 사람이 되고 싶어지는, 부모님께 소개하고 싶은 타입.',
  편인: '나를 꿰뚫어 보는 것 같은 사람. 대화가 깊어지는 상대지만, 가끔 혼자만의 시간이 필요해져요.',
  정인: '나를 품어주는 사람. 기대고 싶고 어리광이 나오는, 마음의 안전지대 같은 존재예요.',
};

// ───────────────────────── 결과 타입 ─────────────────────────

export interface ScoreItem {
  /** 규칙 식별자 (예: 'ilgan.hap', 'ilji.chung') */
  rule: string;
  /** 카드용 한 줄 요약 (예: '배우자궁이 서로 묶이는 인연') */
  summary: string;
  /** 유저에게 노출되는 상세 풀이 (2~3문장) */
  detail: string;
  /** LLM 프롬프트용 건조한 사실 (예: 'A 일지 辰과 B 일지 酉가 육합') */
  fact: string;
  /** 점수 증감 */
  delta: number;
}

export interface GunghapResult {
  /** 최종 점수 0-100 */
  score: number;
  /** 점수 산출 근거 + 풀이 (정밀 리포트의 뼈대) */
  breakdown: ScoreItem[];
  /** A에게 B는 어떤 존재인가 */
  sipsinAtoB: Sipsin;
  /** B에게 A는 어떤 존재인가 */
  sipsinBtoA: Sipsin;
  /** 십신 풀이 문장 (A 관점 / B 관점) */
  sipsinAtoBMeaning: string;
  sipsinBtoAMeaning: string;
  /** 카피 생성용 관계 태그 */
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
      summary: '천간합 — 서로를 강하게 끌어당기는 조합',
      detail: `두 사람의 일간(사주에서 '나'를 뜻하는 글자)이 ${a.stem}${b.stem} 천간합을 이뤄요. 사주에서 손꼽히는 강한 인력으로, 처음 만나도 오래 안 사이처럼 편하고 서로에게 저절로 끌리는 조합이에요. 합해서 ${hap.into} 기운을 만드는 관계라, 함께 있을 때 시너지가 나요.`,
      fact: `A 일간 ${a.stem}과 B 일간 ${b.stem}이 천간합 (합화 ${hap.into})`,
      delta: 18,
    });
    tags.push('stem-hap');
    return;
  }
  if (a.stemElement === b.stemElement) {
    items.push({
      rule: 'ilgan.bihwa',
      summary: '비화 — 닮은꼴, 친구 같은 관계',
      detail: `두 사람의 일간이 같은 ${a.stemElement} 기운이에요. 성향의 결이 비슷해서 설명 없이 통하는 게 많고, 연인이면서 친구 같은 사이가 돼요. 다만 닮은 만큼 고집도 닮아서, 부딪히면 서로 안 굽히는 게 유일한 함정.`,
      fact: `A와 B의 일간이 같은 ${a.stemElement} 오행 (비화)`,
      delta: 5,
    });
    tags.push('stem-same');
    return;
  }
  const aGenB = GENERATES[a.stemElement] === b.stemElement;
  const bGenA = GENERATES[b.stemElement] === a.stemElement;
  if (aGenB || bGenA) {
    const giver = aGenB ? 'A' : 'B';
    const giverEl = aGenB ? a.stemElement : b.stemElement;
    const takerEl = aGenB ? b.stemElement : a.stemElement;
    items.push({
      rule: 'ilgan.sangsaeng',
      summary: '상생 — 한쪽이 기꺼이 밀어주는 흐름',
      detail: `${giverEl} 기운이 ${takerEl} 기운을 살려주는 상생 관계예요. 한쪽이 자연스럽게 챙겨주고 다른 쪽은 그 안에서 커가는, 물 흐르듯 편안한 구도. 주는 쪽이 지치지 않게 받는 쪽의 표현이 중요한 관계예요.`,
      fact: `일간 상생: ${giver}(${giverEl})가 상대(${takerEl})를 생함`,
      delta: 10,
    });
    tags.push(`stem-gen-${giver}`);
    return;
  }
  const aControls = CONTROLS[a.stemElement] === b.stemElement;
  const controller = aControls ? 'A' : 'B';
  const ctrlEl = aControls ? a.stemElement : b.stemElement;
  const ctrldEl = aControls ? b.stemElement : a.stemElement;
  items.push({
    rule: 'ilgan.sanggeuk',
    summary: '상극 — 긴장감 있는 관계, 주도권 구도',
    detail: `${ctrlEl} 기운이 ${ctrldEl} 기운을 누르는 상극 관계예요. 편안하기만 한 사이는 아니고, 묘한 긴장감과 주도권 구도가 생겨요. 나쁘기만 한 건 아니에요 — 서로를 벼리는 관계라, 잘 만나면 서로를 성장시키는 자극이 되기도 해요.`,
    fact: `일간 상극: ${controller}(${ctrlEl})가 상대(${ctrldEl})를 극함`,
    delta: -8,
  });
  tags.push(`stem-control-${controller}`);
}

function evalIlji(a: Pillar, b: Pillar, items: ScoreItem[], tags: string[]): void {
  const ab: [string, string] = [a.branch, b.branch];
  let matched = false;

  if (pairMatch(BRANCH_YUKHAP, ...ab)) {
    matched = true;
    items.push({
      rule: 'ilji.yukhap',
      summary: '일지 육합 — 배우자궁이 서로 묶이는 인연',
      detail: `일지는 사주에서 배우자 자리예요. 두 사람의 배우자궁 ${a.branch}·${b.branch}가 육합으로 묶여 있어요. 궁합에서 가장 반가운 조합 중 하나로, 함께 있는 것 자체가 자연스럽고 살림 궁합(일상 리듬)이 잘 맞는 인연이에요.`,
      fact: `A 일지 ${a.branch}과 B 일지 ${b.branch}이 육합`,
      delta: 15,
    });
    tags.push('branch-yukhap');
  } else {
    const samhap = SAMHAP_GROUPS.find(
      (g) => g.branches.includes(a.branch) && g.branches.includes(b.branch) && a.branch !== b.branch,
    );
    if (samhap) {
      matched = true;
      items.push({
        rule: 'ilji.banhap',
        summary: `일지 반합 — 같은 방향을 보는 자연스러운 합`,
        detail: `두 사람의 배우자궁이 같은 ${samhap.into} 삼합국에 속해요. 가치관이나 지향점이 비슷해서 큰 결정에서 자연스럽게 같은 편이 되는 조합이에요. 육합만큼 착 붙는 느낌은 아니어도, 오래 갈수록 진가가 나오는 합이에요.`,
        fact: `A 일지 ${a.branch}과 B 일지 ${b.branch}이 ${samhap.into}국 반합`,
        delta: 10,
      });
      tags.push('branch-banhap');
    }
  }

  if (pairMatch(BRANCH_CHUNG, ...ab)) {
    matched = true;
    items.push({
      rule: 'ilji.chung',
      summary: '일지 충 — 부딪히며 변화를 만드는 관계',
      detail: `배우자궁 ${a.branch}·${b.branch}가 정면으로 마주 보는 충이에요. 생활 패턴이나 본능적인 반응이 반대라 부딪힐 일이 생기는 조합. 대신 권태기가 없다는 게 충 커플의 반전 매력이에요 — 서로에게 계속 자극이 되거든요. 싸움의 기술만 배우면 오히려 오래 가요.`,
      fact: `A 일지 ${a.branch}과 B 일지 ${b.branch}이 충`,
      delta: -15,
    });
    tags.push('branch-chung');
  }

  const wonjin = pairMatch(BRANCH_WONJIN, ...ab);
  if (wonjin) {
    matched = true;
    items.push({
      rule: 'ilji.wonjin',
      summary: '일지 원진 — 이유 없이 얄미운데 못 헤어지는 살',
      detail: `배우자궁에 원진살이 있어요. 궁합의 단골손님인데, 특징이 재밌어요 — 상대가 딱히 잘못한 게 없는데 괜히 미울 때가 있고, 그런데도 이상하게 못 떨어져요. 애증이 공존하는 관계라, 서운함을 묵히지 말고 바로바로 말하는 게 이 살의 유일한 해법이에요.`,
      fact: `A 일지 ${a.branch}과 B 일지 ${b.branch}이 원진`,
      delta: -7,
    });
    tags.push('branch-wonjin');
  }

  if (pairMatch(BRANCH_HYEONG, ...ab)) {
    matched = true;
    items.push({
      rule: 'ilji.hyeong',
      summary: '일지 형 — 서로를 다듬는 과정의 마찰',
      detail: `배우자궁이 형(刑)의 관계예요. 서로의 방식을 고치려 들다가 마찰이 생기기 쉬운 조합. 근데 형은 '깎아서 맞추는' 살이라, 그 과정을 견디면 누구보다 잘 맞는 한 쌍이 되기도 해요. 상대를 바꾸려 하지 말고 다른 채로 두는 연습이 필요해요.`,
      fact: `A 일지 ${a.branch}과 B 일지 ${b.branch}이 형`,
      delta: -8,
    });
    tags.push('branch-hyeong');
  }

  // 해는 원진과 쌍이 겹치는 경우(子未, 丑午)가 있어 원진이 잡히면 생략 (중복 감점 방지)
  if (!wonjin && pairMatch(BRANCH_HAE, ...ab)) {
    matched = true;
    items.push({
      rule: 'ilji.hae',
      summary: '일지 해 — 은근히 어긋나는 타이밍',
      detail: `배우자궁에 해(害)가 있어요. 큰 싸움은 없는데 묘하게 타이밍이 어긋나는 타입 — 한쪽이 다가가면 한쪽이 바쁘고, 그게 쌓이면 서운함이 돼요. 다행인 건 해는 약한 살이라, 연락 리듬만 서로 맞추면 크게 문제되지 않아요.`,
      fact: `A 일지 ${a.branch}과 B 일지 ${b.branch}이 해`,
      delta: -5,
    });
    tags.push('branch-hae');
  }

  if (!matched) {
    items.push({
      rule: 'ilji.none',
      summary: '일지 무관계 — 서로를 흔들지 않는 담백한 사이',
      detail: `두 사람의 배우자궁은 합도 충도 없는 담백한 관계예요. 운명적인 끌림이나 격한 부딪힘 대신, 서로의 영역을 지켜주는 편안한 거리감이 기본값. 이런 궁합은 만들어가는 재미가 있어요 — 정해진 각본이 없다는 뜻이니까.`,
      fact: `A 일지 ${a.branch}과 B 일지 ${b.branch}은 합충형해 관계 없음`,
      delta: 0,
    });
    tags.push('branch-neutral');
  }
}

function evalYeonji(a: Pillar, b: Pillar, items: ScoreItem[], tags: string[]): void {
  const ab: [string, string] = [a.branch, b.branch];
  const ttiA = BRANCH_TTI[a.branch];
  const ttiB = BRANCH_TTI[b.branch];

  const samhap = SAMHAP_GROUPS.find(
    (g) => g.branches.includes(a.branch) && g.branches.includes(b.branch) && a.branch !== b.branch,
  );
  if (samhap) {
    items.push({
      rule: 'yeonji.samhap',
      summary: `띠 삼합 — ${ttiA}띠와 ${ttiB}띠는 원래 찰떡`,
      detail: `${ttiA}띠와 ${ttiB}띠는 삼합에 속하는 대표적인 찰떡 띠 조합이에요. "네 살 차이는 궁합도 안 본다"는 말이 바로 이 삼합에서 나왔어요. 세대 감각이나 어울리는 무리의 결이 비슷해서, 만나면 금방 가까워지는 조합이에요.`,
      fact: `A 띠(${ttiA})와 B 띠(${ttiB})가 ${samhap.into}국 삼합`,
      delta: 6,
    });
    tags.push('tti-samhap');
  } else if (pairMatch(BRANCH_YUKHAP, ...ab)) {
    items.push({
      rule: 'yeonji.yukhap',
      summary: `띠 육합 — ${ttiA}띠와 ${ttiB}띠의 은근한 합`,
      detail: `${ttiA}띠와 ${ttiB}띠는 육합 관계예요. 겉으로 요란하진 않은데 은근히 서로를 챙기게 되는 조합. 띠 궁합은 두 사람의 타고난 사회적 기질이 맞물리는 자리라, 주변 사람들이 "둘이 잘 어울린다"고 먼저 알아봐요.`,
      fact: `A 띠(${ttiA})와 B 띠(${ttiB})가 육합`,
      delta: 5,
    });
    tags.push('tti-yukhap');
  }

  if (pairMatch(BRANCH_CHUNG, ...ab)) {
    items.push({
      rule: 'yeonji.chung',
      summary: `띠 충 — ${ttiA}띠와 ${ttiB}띠, 여섯 살 차이의 신경전`,
      detail: `${ttiA}띠와 ${ttiB}띠는 충 관계예요. 흔히 "띠가 부딪힌다"고 하는 그 조합. 기질의 방향이 반대라 첫인상에서 서로 낯설 수 있는데, 일지가 좋으면 큰 영향은 없어요 — 띠 충은 궁합 전체에서 양념 정도의 비중이에요.`,
      fact: `A 띠(${ttiA})와 B 띠(${ttiB})가 충`,
      delta: -6,
    });
    tags.push('tti-chung');
  }
  if (pairMatch(BRANCH_WONJIN, ...ab)) {
    items.push({
      rule: 'yeonji.wonjin',
      summary: `띠 원진 — 옛날 어른들이 말리던 그 조합`,
      detail: `${ttiA}띠와 ${ttiB}띠는 원진 관계예요. 전통 혼담에서 어른들이 괜히 한마디 얹던 조합인데, 실제 의미는 '이유 없이 거슬리는 순간이 가끔 있다' 정도예요. 현대 궁합에서는 참고만 하는 항목이니 너무 무겁게 받을 필요 없어요.`,
      fact: `A 띠(${ttiA})와 B 띠(${ttiB})가 원진`,
      delta: -4,
    });
    tags.push('tti-wonjin');
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
        summary: `${el} 상보 — 내게 없는 기운을 상대가 채워줌`,
        detail: `A의 사주에는 ${el} 기운이 하나도 없는데, B는 ${el} 기운을 넉넉히 갖고 있어요. 사주에서 없는 오행은 그 사람의 빈 자리인데, 상대가 그걸 채워주는 관계는 함께 있을 때 묘하게 편안하고 완성되는 느낌을 줘요. 서로에게 필요한 사람이라는 뜻이에요.`,
        fact: `A에게 없는 ${el} 오행을 B가 보유(2개 이상)`,
        delta: 4,
      });
    }
    if (bMissing && a.elementCount[el] >= 2) {
      fillBonus += 4;
      tags.push(`element-fill:${el}`);
      items.push({
        rule: 'element.fill',
        summary: `${el} 상보 — 상대의 빈 자리를 내가 채워줌`,
        detail: `B의 사주에는 ${el} 기운이 없는데, A가 ${el} 기운을 넉넉히 갖고 있어요. 상대의 결핍을 자연스럽게 메워주는 쪽이라, B 입장에서 A와 함께 있으면 이상하게 안정된다고 느낄 확률이 높아요.`,
        fact: `B에게 없는 ${el} 오행을 A가 보유(2개 이상)`,
        delta: 4,
      });
    }
    if (aMissing && bMissing) {
      items.push({
        rule: 'element.bothMissing',
        summary: `${el} 공백 — 둘 다 비어 있는 기운`,
        detail: `두 사람 모두 ${el} 기운이 없어요. 같은 걸 못 하는 커플이라는 뜻인데 — 예를 들어 둘 다 저지르기만 하고 수습을 못 한다거나, 둘 다 참기만 한다거나. 서로 이해는 잘 되지만, 이 부분만큼은 의식적으로 챙겨야 해요.`,
        fact: `A와 B 모두 ${el} 오행이 없음`,
        delta: -3,
      });
      tags.push(`element-void:${el}`);
    }
  }

  if (fillBonus > 12) {
    items.push({
      rule: 'element.fillCap',
      summary: '오행 상보 보너스 상한',
      detail: '오행 상보 가산점은 최대치까지만 반영돼요.',
      fact: '오행 상보 보너스 상한(+12) 초과분 차감',
      delta: -(fillBonus - 12),
    });
  }
}

// ───────────────────────── 공개 API ─────────────────────────

/**
 * 두 명식의 궁합을 계산한다. 인자 순서에 무관하게 대칭적인 점수를 보장한다
 * (십신 방향 표기는 제외 — sipsinAtoB/BtoA로 구분).
 */
export function getGunghap(a: SajuChart, b: SajuChart): GunghapResult {
  const items: ScoreItem[] = [];
  const tags: string[] = [];

  evalIlgan(a.day, b.day, items, tags);
  evalIlji(a.day, b.day, items, tags);
  evalYeonji(a.year, b.year, items, tags);
  evalElementFill(a, b, items, tags);

  const raw = BASE_SCORE + items.reduce((sum, i) => sum + i.delta, 0);
  const score = Math.max(0, Math.min(100, raw));

  const sipsinAtoB = getSipsin(a.day, b.day);
  const sipsinBtoA = getSipsin(b.day, a.day);

  return {
    score,
    breakdown: items,
    sipsinAtoB,
    sipsinBtoA,
    sipsinAtoBMeaning: SIPSIN_MEANING[sipsinAtoB],
    sipsinBtoAMeaning: SIPSIN_MEANING[sipsinBtoA],
    tags,
  };
}
