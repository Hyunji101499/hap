import { getSaju } from '../src/manse.js';
import { getGunghap } from '../src/gunghap.js';

// 궁합 규칙 동작 확인용 케이스
const pairs = [
  {
    label: '케이스1: 임의 커플',
    a: { year: 1997, month: 3, day: 15, hour: 8, minute: 30 },
    b: { year: 1995, month: 11, day: 2, hour: 21 },
  },
  {
    label: '케이스2: 시간 미상 상대',
    a: { year: 1997, month: 3, day: 15, hour: 8, minute: 30 },
    b: { year: 1998, month: 7, day: 24 },
  },
  {
    label: '케이스3: 동일 인물 (자기 자신과의 궁합 — 비화 확인)',
    a: { year: 1990, month: 5, day: 5, hour: 10 },
    b: { year: 1990, month: 5, day: 5, hour: 10 },
  },
];

for (const p of pairs) {
  const sajuA = getSaju(p.a);
  const sajuB = getSaju(p.b);
  const g = getGunghap(sajuA, sajuB);

  console.log(`\n━━━ ${p.label} ━━━`);
  console.log(`A 일주: ${sajuA.day.hangul}(${sajuA.day.hanja})  /  B 일주: ${sajuB.day.hangul}(${sajuB.day.hanja})`);
  console.log(`점수: ${g.score}점`);
  console.log(`십신: B는 A에게 [${g.sipsinAtoB}], A는 B에게 [${g.sipsinBtoA}]`);
  console.log(`태그: ${g.tags.join(', ') || '(없음)'}`);
  console.log('근거:');
  for (const item of g.breakdown) {
    const sign = item.delta >= 0 ? '+' : '';
    console.log(`  [${sign}${item.delta}] ${item.detail}`);
  }
}

// 대칭성 검증: 인자 순서를 바꿔도 점수가 같아야 함
const s1 = getGunghap(getSaju(pairs[0].a), getSaju(pairs[0].b)).score;
const s2 = getGunghap(getSaju(pairs[0].b), getSaju(pairs[0].a)).score;
console.log(`\n대칭성 검증: ${s1} === ${s2} → ${s1 === s2 ? 'OK' : '!!!! FAIL !!!!'}`);
