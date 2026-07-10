import { getSaju } from '../src/manse.js';

// 검증용: 아래 결과를 온라인 만세력(포스텔러, 원광만세력 등)과 대조할 것
const cases = [
  { label: '1997-03-15 08:30', input: { year: 1997, month: 3, day: 15, hour: 8, minute: 30 } },
  { label: '1990-01-01 00:30 (자시 경계)', input: { year: 1990, month: 1, day: 1, hour: 0, minute: 30 } },
  { label: '2000-02-04 (입춘 당일, 시간 미상)', input: { year: 2000, month: 2, day: 4 } },
];

for (const c of cases) {
  const saju = getSaju(c.input);
  const fmt = (p: { hangul: string; hanja: string } | null) => (p ? `${p.hangul}(${p.hanja})` : '미상');
  console.log(`\n■ ${c.label}`);
  console.log(`  년주: ${fmt(saju.year)}  월주: ${fmt(saju.month)}  일주: ${fmt(saju.day)}  시주: ${fmt(saju.hour)}`);
  console.log(`  오행: ${Object.entries(saju.elementCount).map(([k, v]) => `${k}${v}`).join(' ')}`);
}
