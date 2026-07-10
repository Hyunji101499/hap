/**
 * 만세력 변환 모듈
 * 양력 생년월일시 → 사주 명식(년/월/일/시 4주 간지)
 *
 * 절기 기반 월주 계산 등 천문 계산은 lunar-typescript(6tail)에 위임하고,
 * 이 모듈은 한국어 표기·오행 매핑·hap 도메인 타입으로의 변환을 담당한다.
 *
 * 참고: 진태양시 보정(경도 -32분), 야자시/조자시 처리는 MVP에서 다루지 않음.
 *       표준시(KST) 기준으로 계산하며, 필요 시 옵션으로 확장한다.
 */
import { Solar } from 'lunar-typescript';

export type Element = '목' | '화' | '토' | '금' | '수';

export interface Pillar {
  /** 간지 한자 표기 (예: '甲子') */
  hanja: string;
  /** 간지 한글 표기 (예: '갑자') */
  hangul: string;
  /** 천간 (한자) */
  stem: string;
  /** 지지 (한자) */
  branch: string;
  /** 천간 오행 */
  stemElement: Element;
  /** 지지 오행 */
  branchElement: Element;
}

export interface SajuInput {
  /** 양력 연도 (예: 1997) */
  year: number;
  /** 월 1-12 */
  month: number;
  /** 일 1-31 */
  day: number;
  /** 시 0-23. 모르면 생략 → 시주 없이 3주만 계산 */
  hour?: number;
  /** 분 0-59. 기본 0 */
  minute?: number;
}

export interface SajuChart {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  /** 태어난 시간을 모르면 null */
  hour: Pillar | null;
  /** 명식 전체(시주 미상이면 6글자)의 오행 분포 */
  elementCount: Record<Element, number>;
  input: SajuInput;
}

export const STEM_HANGUL: Record<string, string> = {
  甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무',
  己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계',
};

const BRANCH_HANGUL: Record<string, string> = {
  子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사',
  午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해',
};

export const STEM_ELEMENT: Record<string, Element> = {
  甲: '목', 乙: '목', 丙: '화', 丁: '화', 戊: '토',
  己: '토', 庚: '금', 辛: '금', 壬: '수', 癸: '수',
};

const BRANCH_ELEMENT: Record<string, Element> = {
  子: '수', 丑: '토', 寅: '목', 卯: '목', 辰: '토', 巳: '화',
  午: '화', 未: '토', 申: '금', 酉: '금', 戌: '토', 亥: '수',
};

/** '甲子' 형태의 간지 문자열을 Pillar로 변환 */
function toPillar(ganzhi: string): Pillar {
  const stem = ganzhi.charAt(0);
  const branch = ganzhi.charAt(1);
  const stemElement = STEM_ELEMENT[stem];
  const branchElement = BRANCH_ELEMENT[branch];
  if (!stemElement || !branchElement) {
    throw new Error(`알 수 없는 간지: ${ganzhi}`);
  }
  return {
    hanja: ganzhi,
    hangul: `${STEM_HANGUL[stem]}${BRANCH_HANGUL[branch]}`,
    stem,
    branch,
    stemElement,
    branchElement,
  };
}

function validate(input: SajuInput): void {
  const { year, month, day, hour, minute } = input;
  if (year < 1900 || year > 2100) throw new Error(`지원 범위(1900-2100) 밖의 연도: ${year}`);
  if (month < 1 || month > 12) throw new Error(`잘못된 월: ${month}`);
  if (day < 1 || day > 31) throw new Error(`잘못된 일: ${day}`);
  if (hour !== undefined && (hour < 0 || hour > 23)) throw new Error(`잘못된 시: ${hour}`);
  if (minute !== undefined && (minute < 0 || minute > 59)) throw new Error(`잘못된 분: ${minute}`);
}

/**
 * 양력 생년월일시로 사주 명식을 계산한다.
 * 시간 미상(hour 생략) 시 시주는 null이 되며, 오행 분포도 6글자 기준으로 계산된다.
 */
export function getSaju(input: SajuInput): SajuChart {
  validate(input);
  const hourKnown = input.hour !== undefined;

  // 시간 미상이면 정오로 두고 계산하되 시주는 버린다.
  // (년/월/일주는 자시 경계만 피하면 시간의 영향을 받지 않음)
  const solar = Solar.fromYmdHms(
    input.year, input.month, input.day,
    input.hour ?? 12, input.minute ?? 0, 0,
  );
  const eightChar = solar.getLunar().getEightChar();

  const year = toPillar(eightChar.getYear());
  const month = toPillar(eightChar.getMonth());
  const day = toPillar(eightChar.getDay());
  const hour = hourKnown ? toPillar(eightChar.getTime()) : null;

  const elementCount: Record<Element, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const p of [year, month, day, hour]) {
    if (!p) continue;
    elementCount[p.stemElement] += 1;
    elementCount[p.branchElement] += 1;
  }

  return { year, month, day, hour, elementCount, input };
}
