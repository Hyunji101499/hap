import { getSaju } from '../src/manse';
import { canUnlockDeepReport, getDeepReport } from '../src/report';

const resolveYearBranch = (y: number) => getSaju({ year: y, month: 6, day: 15 }).year.branch;

// 케이스1: 둘 다 시주 있음 → 해금
const a = getSaju({ year: 1997, month: 3, day: 15, hour: 8, minute: 30 });
const b = getSaju({ year: 1995, month: 11, day: 2, hour: 21 });
console.log(`해금 가능(둘 다 시간 있음): ${canUnlockDeepReport(a, b)}`);

const report = getDeepReport(a, b, 2026, resolveYearBranch);
for (const sec of [report.conflict, report.timing, report.intimacy]) {
  console.log(`\n━━━ ${sec.title} ━━━`);
  for (const p of sec.paragraphs) console.log(`· ${p}`);
}

// 케이스2: 상대 시주 없음 → 잠금
const c = getSaju({ year: 1998, month: 7, day: 24 });
console.log(`\n해금 가능(상대 시간 없음): ${canUnlockDeepReport(a, c)} (false여야 정상)`);
