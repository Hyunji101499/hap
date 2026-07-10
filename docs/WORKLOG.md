# hap 개발 로그

## 2026-07-10 (2일차) — core 완성 + 웹 MVP + 심층 리포트

### 완료한 것

- **만세력 모듈 web 연동**: `@hap/core` workspace 의존성, `transpilePackages`, 확장자 없는 상대 import로 통일 (Turbopack의 `.js`→`.ts` 매핑 이슈 회피)
- **웹 MVP** (`web/src/app/page.tsx`): 2인 입력 폼 → 궁합 카드. 한지·세리프 테마 (나눔명조, #FBF4EC/#D85A30 팔레트)
- **궁합 엔진 v2**: ScoreItem 3단 구조 (summary/detail/fact), 원진살·띠 궁합(년지)·일지 무관계 중립 풀이 추가, 십신 의미 사전(SIPSIN_MEANING)
- **심층 리포트** (`core/src/report.ts`, 해금 조건 = 양쪽 시주 존재):
  - 갈등 포인트: 십신 조합 패턴 4종 (자존심/주도권/말/돌봄) + 최대 마찰 지점 심화
  - 연애 타이밍: 향후 3년 세운 지지 vs 각자 일지의 합/충 판정, "두 사람의 해" 지목
  - 속마음 궁합: 일지 지장간 본기 십신 (겉↔속 반전 구조) + 오행 온도 매칭 (불/봄바람/온돌/가을바람/깊은 물)
- **이름 대입 + 조사 자동화**: `getGunghap`/`getDeepReport`에 names 파라미터, `core/src/josa.ts` (받침 판별 이/가·은/는·와/과·으로/로)
- **강조 시스템**: core가 `**...**` 마킹 → 웹 Rich 컴포넌트가 하이라이트 렌더링. 연애 타이밍은 연도 배지 구조화
- 네이밍 결정: "속궁합" → "속마음 궁합"

### 미결/주의

- **만세력 외부 검증 아직 안 함** — 포스텔러/원광만세력과 일주 대조 필요 (본인 사주 기해 일주가 맞는지 확인 필요)
- 환경 함정 3개 재확인: ① PowerShell 5.1로 한글 파일 읽고 쓰면 인코딩 파괴 (JetBrains MCP 도구만 사용) ② JetBrains MCP는 활성 프로젝트 창 기준 동작 — mcare4 창으로 전환돼 있으면 hap 파일 못 찾음 ③ **로컬 pnpm은 항상 최신(11.x)을 깔지 말 것 — Vercel 빌드 환경에서 npm 레지스트리 fetch 시 `ERR_INVALID_THIS`로 실패하는 버그 있음. pnpm 9.x 계열로 고정 (`packageManager` 필드 + 로컬 전역 설치 버전 일치 유지)**

### 배포

- **GitHub**: https://github.com/Hyunji101499/hap (main 브랜치)
- **Vercel**: 연결 완료, main push마다 자동 배포. Root Directory = `web`, "Include files outside of Root Directory" 토글 ON (모노레포 때문에 필수)
- 배포 삽질 기록: pnpm 11로 만든 lockfile을 Vercel이 파싱 실패 → npm 폴백 → `workspace:*` 프로토콜 모름 → 실패. `packageManager` 필드 핀만으론 해결 안 됨 (Vercel 내장 pnpm이 lockfile 자체를 못 읽음). Install Command를 `corepack enable && pnpm install`로 오버라이드했으나 이번엔 pnpm 11 자체의 npm 레지스트리 통신 버그(`ERR_INVALID_THIS`)로 재차 실패. **최종 해결: pnpm 9.15.0으로 다운그레이드 후 lockfile 재생성**

### 다음 후보 (우선순위 순)

1. **지인 테스트**: 배포 URL로 실제 반응 받기 (다음 세션 최우선)
2. **공유 링크 + DB**: 결과 영속화(Neon/Supabase PG), 고유 URL, 상대 시간 입력 해금 플로우, OG 이미지 (바이럴 루프 완성)
3. **LLM 종합 카피**: breakdown fact들을 프롬프트로 → 커플 맞춤 헤드라인/종합 풀이 (API Route + 키 관리)
4. 모바일 뷰 점검, 카드 이미지 저장 기능

## 2026-07-09 (1일차) — 프로젝트 결정 및 뼈대 구축

### 제품 결정사항

- **최종 아이디어**: 사주 기반 블라인드 소개팅 ("사주 블라인드")
  - 외모/스펙 없이 사주 궁합 점수와 명식 해석만 보고 대화를 시작하는 소개팅 서비스
  - 블라인드 단계 해금 구조: 매칭 시 명식+궁합 리포트만 → 대화 왕복 N회마다 목소리 → 실루엣 → 프로필 순 공개
- **실행 전략 (콜드스타트 대응)**: 데이팅 앱을 바로 만들지 않고 2단계로 진행
  - **1단계 (현재)**: 궁합 리포트 바이럴 툴. 내 생년월일시 + 상대 생년월일 → 인스타 공유용 궁합 카드. 공유 링크로 상대가 자기 시간을 입력하면 정밀 궁합 해금 (바이럴 루프 + 명식 DB 축적)
  - **2단계**: 축적된 유저풀 대상으로 "궁합 90점 이상인 사람이 N명 있어요" 매칭 오픈. 서울 2030 여성 세그먼트부터 밀도 확보
- **수익 모델**: 궁합 정밀 리포트 건당 과금 (연애운 타이밍, 갈등 포인트, 속궁합), 해금 가속권
- **성공 판정 기준 (1단계)**: 4주 내 카드 생성 1,000건 + 공유 링크 유입 상대 입력 전환율 15% 이상 → 2단계 검토. 미달 시 개선 1사이클 후 재측정, 그래도 미달이면 중단
- **핵심 설계 원칙**: 궁합 점수는 서버 규칙 로직(합/충/형/해, 오행 상보성, 십신 관계)이 계산하고, LLM은 해석 카피 텍스트만 생성 (점수 신뢰성 확보)
- **주의사항**: 생년월일시+연락처 조합 개인정보 처리 설계 필요. 운세는 "재미/참고용" 고지, 건강·투자 판단 유도 표현 금지

### 기술 결정사항

- **스택**: 풀 TypeScript (Node 22 LTS + Next.js 16 + React 19 + Tailwind 4 + pnpm 11 모노레포)
  - 선정 이유: OG 이미지 동적 생성(공유 카드가 카톡/인스타 미리보기에 떠야 함), Vercel 배포 편의성
- **모노레포 구조**: `web/`(Next.js 앱) + `core/`(만세력/궁합 순수 로직, 2단계 이관 대비 분리) + `docs/`
- **만세력 계산**: 직접 구현하지 않고 `lunar-typescript`(6tail lunar) 래핑
  - 이유: 월주(月柱)는 절기 기반이라 천문 계산 필요. 검증된 라이브러리에 위임하고 우리 자산은 상위 궁합 규칙에 집중
  - MVP 범위: 표준시(KST) 기준. 진태양시 보정(-32분), 야자시/조자시는 추후 옵션으로

### 완료한 것

- IntelliJ Empty Project로 `D:\work\hap` 생성, pnpm 11 모노레포 초기화
- create-next-app으로 `web/` 생성 (Next.js 16.2.10, React 19.2.4, Tailwind 4, App Router, src 디렉토리), dev 서버 기동 확인
- pnpm 11 빌드 스크립트 승인 이슈 해결 (`pnpm approve-builds` → `allowBuilds` 키. `onlyBuiltDependencies`는 구버전 키라 무시됨)
- git 초기화, 커밋: `1a85cac` (scaffold), `07d4740` (중복 lockfile 제거)
- `core/` 초기화: `@hap/core`, 의존성 (lunar-typescript, tsx, typescript, @types/node)
- 만세력 모듈 작성: `core/src/manse.ts` (getSaju: 양력 → 4주 간지 + 한글표기 + 오행분포, 시간미상 처리)

### 다음 TODO

1. `pnpm --filter @hap/core check` 실행 → 3개 케이스를 온라인 만세력(포스텔러, 원광만세력)과 대조
   - 특히 자시 경계(00:30)와 입춘 당일(2/4) 케이스 — 만세력 구현의 대표적 함정 지점
2. 검증 통과 시 커밋 후 **궁합 규칙 모듈** 설계:
   - 일간 관계 (합/충/생/극) — 가중치 최대
   - 일지 지지 관계 (육합/삼합/충/형/해)
   - 오행 분포 상보성
   - 십신 관계 ("너는 나한테 편관" 카피의 원천)

### 환경 이슈 기록

- IDE 터미널이 구형 Windows PowerShell 5.1: `&&` 미지원 (`;` 사용), 긴/멀티라인 명령에서 PSReadLine 크래시
- 파일 작성은 JetBrains MCP `create_new_file_with_text` 사용 (터미널 우회)
- (선택) Settings → Tools → Terminal → Shell path를 PowerShell 7이나 git bash로 변경 권장
