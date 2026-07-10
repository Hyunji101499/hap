/**
 * 심층 리포트 모듈 — 해금 콘텐츠 (갈등 포인트 / 연애 타이밍 / 속마음 궁합)
 *
 * 해금 조건: 두 사람 모두 태어난 시간(시주)이 있을 것.
 * (시주가 있어야 명식 8글자가 완성되어 정밀 해석이 가능하다는 명분 + 바이럴 장치)
 *
 * 모든 텍스트는 결정론적 규칙으로 생성된다. LLM 도입 시 이 출력이 프롬프트 재료가 된다.
 */
import { STEM_ELEMENT, STEM_HANGUL, type Pillar, type SajuChart } from './manse';
import { getSipsin, getGunghap, SIPSIN_MEANING, type Sipsin } from './gunghap';

// ───────────────────────── 테이블 ─────────────────────────

/** 지장간 본기(本氣): 지지 속에 숨은 대표 천간 — 속마음 궁합의 재료 */
const HIDDEN_STEM: Record<string, string> = {
  子: '癸', 丑: '己', 寅: '甲', 卯: '乙', 辰: '戊', 巳: '丙',
  午: '丁', 未: '己', 申: '庚', 酉: '辛', 戌: '戊', 亥: '壬',
};

/** 오행별 온도 — 속마음 궁합의 표현 방식 해석용 */
const ELEMENT_TEMPER: Record<string, { label: string; desc: string }> = {
  화: { label: '불', desc: '표현이 직접적이고 뜨거운' },
  목: { label: '봄바람', desc: '표현이 다정하고 살가운' },
  토: { label: '온돌', desc: '표현은 무뚝뚝해도 속은 진득한' },
  금: { label: '가을바람', desc: '표현이 절제되고 담백한' },
  수: { label: '깊은 물', desc: '표현이 은근하고 속을 다 안 보여주는' },
};

/** 지지 육합/삼합/충 — 세운 판정용 (gunghap과 동일 정의, 순환 의존 방지를 위해 지역 보유) */
const YUKHAP: Array<[string, string]> = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
];
const SAMHAP: string[][] = [
  ['申', '子', '辰'], ['亥', '卯', '未'], ['寅', '午', '戌'], ['巳', '酉', '丑'],
];
const CHUNG: Array<[string, string]> = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
];

// ───────────────────────── 타입 ─────────────────────────

export interface ReportSection {
  title: string;
  paragraphs: string[];
}

export interface DeepReport {
  conflict: ReportSection;
  timing: ReportSection;
  intimacy: ReportSection;
}

// ───────────────────────── 유틸 ─────────────────────────

function pairMatch(list: Array<[string, string]>, a: string, b: string): boolean {
  return list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** 한글 마지막 글자의 받침 유무 → 조사 선택 (이/가, 으로/로 등) */
function josa(word: string, withBatchim: string, without: string): string {
  const ch = word.replace(/[^가-힣]/g, '').slice(-1);
  if (!ch) return without;
  const hasBatchim = (ch.charCodeAt(0) - 0xac00) % 28 > 0;
  return hasBatchim ? withBatchim : without;
}

function sameSamhap(a: string, b: string): boolean {
  return a !== b && SAMHAP.some((g) => g.includes(a) && g.includes(b));
}

/** 지장간 본기로 십신 계산용 가상 Pillar 생성 */
function hiddenPillar(branch: string): Pillar {
  const stem = HIDDEN_STEM[branch];
  return {
    hanja: stem + branch,
    hangul: STEM_HANGUL[stem] ?? stem,
    stem,
    branch,
    stemElement: STEM_ELEMENT[stem],
    branchElement: STEM_ELEMENT[stem],
  };
}

/** 두 사람 모두 시주가 있는가 — 해금 조건 */
export function canUnlockDeepReport(a: SajuChart, b: SajuChart): boolean {
  return a.hour !== null && b.hour !== null;
}

// ───────────────────────── 1. 갈등 포인트 ─────────────────────────

/** 십신 조합별 대표 갈등 패턴 (방향 무관 매칭) */
const CONFLICT_PATTERNS: Array<{
  match: (ab: Sipsin, ba: Sipsin) => boolean;
  text: string;
}> = [
  {
    match: (ab, ba) => (ab === '비견' || ab === '겁재') && (ba === '비견' || ba === '겁재'),
    text: '두 사람의 갈등 축은 자존심이에요. 서로 대등한 구도라 평소엔 제일 편한 사이지만, 싸움이 나면 먼저 굽히는 쪽이 지는 것 같아서 냉전이 길어져요. 화해의 기술: 잘잘못 정리는 미루고 "밥 먹자" 한마디로 끊어내기. 이 조합은 논리로 푸는 것보다 일상으로 복귀하는 게 빨라요.',
  },
  {
    match: (ab, ba) => (ab === '편관' || ab === '정관') && (ba === '편재' || ba === '정재'),
    text: '갈등의 축은 주도권과 소유예요. 한쪽은 상대 앞에서 묘하게 긴장하고(관), 다른 쪽은 상대를 자기 사람으로 확실히 하고 싶어해요(재). 평소엔 이 구도가 서로를 끌어당기는 힘인데, 지치면 "왜 나만 맞추지"와 "왜 내 맘대로 안 되지"가 충돌해요. 역할을 가끔 뒤집어보는 게 처방이에요 — 늘 리드하던 쪽이 하루 완전히 따라가 보기.',
  },
  {
    match: (ab, ba) => ab === '상관' || ba === '상관',
    text: '갈등의 도화선은 말이에요. 이 조합엔 상관 기운이 끼어 있어서, 대화가 제일 재밌는 커플인 동시에 농담이 선을 넘는 순간 상처가 훅 깊어져요. 특히 장난 끝에 나온 진담 반 농담 반이 위험해요. 규칙 하나면 충분해요: 싸울 때 "아까 그 말"을 소환하지 않기.',
  },
  {
    match: (ab, ba) => (ab === '편인' || ab === '정인') && (ba === '식신' || ba === '상관'),
    text: '갈등 축은 돌봄의 방향이에요. 한쪽은 품어주려 하고(인성) 다른 쪽은 표현하고 발산하려 해요(식상). 좋을 땐 완벽한 보호자-자유인 조합인데, 틀어지면 "애 취급하지 마"와 "왜 내 걱정을 몰라줘"로 부딪혀요. 보호가 통제가 되는 순간을 서로 알아채는 게 관건이에요.',
  },
];

function buildConflict(a: SajuChart, b: SajuChart): ReportSection {
  const g = getGunghap(a, b);
  const paragraphs: string[] = [];

  const pattern = CONFLICT_PATTERNS.find((p) => p.match(g.sipsinAtoB, g.sipsinBtoA));
  if (pattern) paragraphs.push(pattern.text);

  const negatives = g.breakdown.filter((i) => i.delta < 0 && i.rule !== 'element.fillCap');
  if (negatives.length > 0) {
    const worst = negatives.reduce((m, i) => (i.delta < m.delta ? i : m));
    paragraphs.push(
      `명식에서 가장 눈에 띄는 마찰 지점은 '${worst.summary.split(' — ')[0]}'이에요. ${worst.detail} 이 지점은 없앨 수 있는 게 아니라 다루는 거예요 — 패턴을 아는 것만으로 절반은 해결이에요.`,
    );
  } else {
    paragraphs.push(
      '명식상 크게 긁는 지점이 없는 조합이에요. 이런 커플의 함정은 딱 하나 — 갈등이 없어서 서운함도 말 안 하고 넘어가는 것. 문제가 없는 것과 대화가 없는 건 다르다는 것만 기억하면 돼요.',
    );
  }

  if (pattern === undefined && negatives.length > 0) {
    paragraphs.push(
      `서로에게 ${g.sipsinAtoB}·${g.sipsinBtoA}인 관계라는 것도 힌트예요. ${SIPSIN_MEANING[g.sipsinAtoB]} 이 성질이 과해지는 순간이 곧 갈등의 시작점이니, 그 직전에 브레이크를 잡으면 돼요.`,
    );
  }

  return { title: '갈등 포인트 심층 분석', paragraphs };
}

// ───────────────────────── 2. 연애 타이밍 ─────────────────────────

/** 특정 연도의 년주 지지 (입춘 경계 이슈를 피해 연중 시점으로 계산) */
export type YearBranchResolver = (year: number) => string;

function judgeYear(yearBranch: string, dayBranch: string): 'hap' | 'chung' | 'plain' {
  if (pairMatch(YUKHAP, yearBranch, dayBranch) || sameSamhap(yearBranch, dayBranch)) return 'hap';
  if (pairMatch(CHUNG, yearBranch, dayBranch)) return 'chung';
  return 'plain';
}

function buildTiming(
  a: SajuChart, b: SajuChart, baseYear: number, resolveYearBranch: YearBranchResolver,
): ReportSection {
  const paragraphs: string[] = [];
  const years = [baseYear, baseYear + 1, baseYear + 2];
  let bestYear: number | null = null;
  let bestHits = 0;

  for (const y of years) {
    const yb = resolveYearBranch(y);
    const ja = judgeYear(yb, a.day.branch);
    const jb = judgeYear(yb, b.day.branch);
    const hits = (ja === 'hap' ? 1 : 0) + (jb === 'hap' ? 1 : 0);
    if (hits > bestHits) { bestHits = hits; bestYear = y; }

    let line: string;
    if (ja === 'hap' && jb === 'hap') {
      line = `${y}년 — 두 사람의 배우자궁이 동시에 합을 이루는 해예요. 관계가 다음 단계로 넘어가기 가장 좋은 타이밍.`;
    } else if (ja === 'hap' || jb === 'hap') {
      const who = ja === 'hap' ? 'A' : 'B';
      line = `${y}년 — ${who}의 인연운이 발동하는 해예요. 이때 ${who} 쪽에서 마음의 움직임이 커져요.`;
    } else if (ja === 'chung' || jb === 'chung') {
      const who = ja === 'chung' ? 'A' : 'B';
      line = `${y}년 — ${who}의 배우자궁이 흔들리는 해. 나쁜 뜻만은 아니고, 이사·이직 같은 환경 변화가 관계에 이벤트를 만들어요.`;
    } else {
      line = `${y}년 — 큰 발동 없이 잔잔하게 흐르는 해. 관계의 기초 체력을 쌓기 좋은 시기예요.`;
    }
    paragraphs.push(line);
  }

  if (bestYear !== null) {
    paragraphs.push(
      bestHits === 2
        ? `정리하면, 두 사람의 해는 ${bestYear}년이에요. 중요한 결정(고백, 동거, 결혼 얘기)을 이 해에 얹으면 흐름을 타요.`
        : `정리하면, 향후 3년 중 가장 기운이 움직이는 해는 ${bestYear}년이에요.`,
    );
  } else {
    paragraphs.push(
      '향후 3년은 큰 파도 없이 잔잔한 흐름이에요. 타이밍의 도움이 없다는 건, 반대로 언제 결정해도 불리하지 않다는 뜻이기도 해요.',
    );
  }

  return { title: '연애 타이밍 (향후 3년)', paragraphs };
}

// ───────────────────────── 3. 속마음 궁합 ─────────────────────────

function buildIntimacy(a: SajuChart, b: SajuChart): ReportSection {
  const paragraphs: string[] = [];

  const outerAtoB = getSipsin(a.day, b.day);
  const hidA = hiddenPillar(a.day.branch);
  const hidB = hiddenPillar(b.day.branch);
  const innerAtoB = getSipsin(hidA, hidB);
  const innerBtoA = getSipsin(hidB, hidA);

  paragraphs.push(
    `사주에서 겉궁합은 일간(드러나는 나), 속마음 궁합은 일지 속에 숨은 글자(지장간)로 봐요. A의 일지 ${a.day.branch} 속에는 ${STEM_HANGUL[HIDDEN_STEM[a.day.branch]]}(${HIDDEN_STEM[a.day.branch]}), B의 일지 ${b.day.branch} 속에는 ${STEM_HANGUL[HIDDEN_STEM[b.day.branch]]}(${HIDDEN_STEM[b.day.branch]})${josa(STEM_HANGUL[HIDDEN_STEM[b.day.branch]], '이', '가')} 숨어 있어요 — 이게 두 사람이 가장 가까워졌을 때 드러나는 진짜 속마음이에요.`,
  );

  if (innerAtoB === outerAtoB) {
    paragraphs.push(
      `겉과 속이 같은 커플이에요. 드러나는 관계(${outerAtoB})와 속마음의 관계(${innerAtoB})가 일치해서, 가까워질수록 "역시 내가 알던 그 사람"이라는 안정감이 커져요. 반전은 없지만 배신감도 없는, 투명한 속마음 궁합이에요.`,
    );
  } else {
    paragraphs.push(
      `겉과 속이 다른, 반전 있는 커플이에요. 겉으로는 ${outerAtoB}의 관계인데, 속마음끼리는 ${innerAtoB}·${innerBtoA}${josa(innerBtoA, '으로', '로')} 만나요. ${SIPSIN_MEANING[innerAtoB]} — 가까워질수록 이 얼굴이 나와요. 겉만 보고 판단하면 서로를 반만 아는 거예요.`,
    );
  }

  const tA = ELEMENT_TEMPER[STEM_ELEMENT[HIDDEN_STEM[a.day.branch]]];
  const tB = ELEMENT_TEMPER[STEM_ELEMENT[HIDDEN_STEM[b.day.branch]]];
  if (tA.label === tB.label) {
    paragraphs.push(
      `속마음의 온도는 둘 다 '${tA.label}' — ${tA.desc} 타입이에요. 온도가 같아서 표현의 결로 오해할 일은 적어요. 같은 온도끼리는 리듬만 맞추면 돼요.`,
    );
  } else {
    paragraphs.push(
      `속마음의 온도가 달라요. A는 '${tA.label}'(${tA.desc} 타입), B는 '${tB.label}'(${tB.desc} 타입)이에요. 애정의 크기가 아니라 표현 방식이 다른 것뿐인데, 이걸 모르면 "쟤는 날 덜 좋아하나"로 오해하기 쉬워요. 상대의 온도로 번역해서 읽는 연습이 속마음 궁합의 전부예요.`,
    );
  }

  return { title: '속마음 궁합', paragraphs };
}

// ───────────────────────── 공개 API ─────────────────────────

/**
 * 심층 리포트 생성. 해금 조건(양쪽 시주 존재)은 canUnlockDeepReport로 사전 검사할 것.
 * @param baseYear 타이밍 분석 시작 연도 (보통 현재 연도)
 * @param resolveYearBranch 연도 → 년지 변환 함수 (보통 manse의 getSaju를 감싸 주입)
 */
export function getDeepReport(
  a: SajuChart, b: SajuChart, baseYear: number, resolveYearBranch: YearBranchResolver,
): DeepReport {
  return {
    conflict: buildConflict(a, b),
    timing: buildTiming(a, b, baseYear, resolveYearBranch),
    intimacy: buildIntimacy(a, b),
  };
}
