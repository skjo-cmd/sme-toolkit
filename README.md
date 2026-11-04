 경영 도구함 (sme-toolkit)# 경영 도구함 (sme-toolkit)
 경영 도구함 (sme-toolkit)
 경영 도구함 (sme-toolkit)창업기업·중소기업·소상공인을 위한 세무·노무 계산기와 체크리스트. 산식·중간값·법령 조문을 전부 공개하고, 입력값은 서버로 보내지 않는다.
 경영 도구함 (sme-toolkit)
 경영 도구함 (sme-toolkit)## 구조
 경영 도구함 (sme-toolkit)
 경영 도구함 (sme-toolkit)```
 경영 도구함 (sme-toolkit)src/rates/2026.json          모든 세율·요율·한도. 계산기는 이 파일만 읽는다 (status: confirmed/proposed, 출처 URL)
 경영 도구함 (sme-toolkit)src/rates/calendar-2026.json 세무 일정과 공휴일
 경영 도구함 (sme-toolkit)src/engine/                  순수 함수. UI 의존 없음. 결과에 steps[](중간값)를 포함
 경영 도구함 (sme-toolkit)  payroll.ts severance.ts incomeTax.ts salary.ts incorporation.ts calendar.ts
 경영 도구함 (sme-toolkit)  __tests__/                 골든 테스트(외부 도구 실측값·손계산 대조)
 경영 도구함 (sme-toolkit)src/app/                     Next.js App Router, 정적 내보내기(output: export)
 경영 도구함 (sme-toolkit)src/components/tools/        도구별 클라이언트 컴포넌트
 경영 도구함 (sme-toolkit)src/content/checklists.ts    체크리스트 데이터
 경영 도구함 (sme-toolkit)```
 경영 도구함 (sme-toolkit)
 경영 도구함 (sme-toolkit)규칙
 경영 도구함 (sme-toolkit)- 엔진 함수 안에 숫자 리터럴 금지. 상수는 rates 파일에서만.
 경영 도구함 (sme-toolkit)- 화면의 "계산 과정"은 엔진이 돌려준 steps[]를 그대로 그린다. 산식 설명과 결과가 어긋날 수 없게.
 경영 도구함 (sme-toolkit)- 도구마다 "이 계산기가 다루지 않는 것"을 결과 아래 고정 표시.
 경영 도구함 (sme-toolkit)- 입력은 타이핑 즉시 반영. 포커스 이탈 시 반영 금지.
 경영 도구함 (sme-toolkit)- 외부 스크립트·폰트·분석 도구 없음. 공유 링크는 URL 해시에 입력값만 담는다.
 경영 도구함 (sme-toolkit)
 경영 도구함 (sme-toolkit)## 명령
 경영 도구함 (sme-toolkit)
 경영 도구함 (sme-toolkit)```bash
 경영 도구함 (sme-toolkit)npm install
 경영 도구함 (sme-toolkit)npm test          # vitest 골든 테스트
 경영 도구함 (sme-toolkit)npm run typecheck
 경영 도구함 (sme-toolkit)npm run build     # out/ 에 정적 사이트 생성
 경영 도구함 (sme-toolkit)npm run dev
 경영 도구함 (sme-toolkit)```
 경영 도구함 (sme-toolkit)
 경영 도구함 (sme-toolkit)## 갱신 리듬
 경영 도구함 (sme-toolkit)
 경영 도구함 (sme-toolkit)| 시기 | 대상 |
 경영 도구함 (sme-toolkit)|---|---|
 경영 도구함 (sme-toolkit)| 1월 | 소득세·법인세율, 공제 한도, 건강보험·장기요양 요율, 세무 캘린더 |
 경영 도구함 (sme-toolkit)| 7월 | 국민연금 기준소득월액 상·하한, 다음 해 최저임금 |
 경영 도구함 (sme-toolkit)| 12월 | 다음 해 rates 파일 확정, proposed → confirmed |
 경영 도구함 (sme-toolkit)
 경영 도구함 (sme-toolkit)갱신 시 `src/app/changelog/page.tsx`에 날짜·변경 상수·출처를 남긴다.
 경영 도구함 (sme-toolkit)
 경영 도구함 (sme-toolkit)## 확인 필요 표기(2026-11-05 기준)
 경영 도구함 (sme-toolkit)
 경영 도구함 (sme-toolkit)- 2026 사업연도 법인세율 1%p 인상분: 공포본 재확인
 경영 도구함 (sme-toolkit)- 2026 공휴일 목록: 관보 대조
 경영 도구함 (sme-toolkit)- 국민연금 상한 6,370,000원: 2026-07 고시 뒤 교체
 경영 도구함 (sme-toolkit)
 경영 도구함 (sme-toolkit)## 기여·제보
 경영 도구함 (sme-toolkit)
 경영 도구함 (sme-toolkit)틀린 숫자를 보셨다면 이슈로 알려 주세요. "계산 과정" 펼침에서 어느 줄이 틀렸는지와 근거 조문을 적어 주시면 가장 빠릅니다. 상수 변경 PR에는 출처 URL이 있어야 합니다.
 경영 도구함 (sme-toolkit)
 경영 도구함 (sme-toolkit)## 라이선스
 경영 도구함 (sme-toolkit)
 경영 도구함 (sme-toolkit)MIT. 세무·노무 결과는 참고용이며 개별 판단은 자격사와 확인하십시오.
