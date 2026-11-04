# 경영 도구함 (sme-toolkit)

창업기업·중소기업·소상공인을 위한 세무·노무 계산기와 체크리스트. 산식·중간값·법령 조문을 전부 공개하고, 입력값은 서버로 보내지 않는다.

## 구조

```
src/rates/2026.json          모든 세율·요율·한도. 계산기는 이 파일만 읽는다 (status: confirmed/proposed, 출처 URL)
src/rates/calendar-2026.json 세무 일정과 공휴일
src/engine/                  순수 함수. UI 의존 없음. 결과에 steps[](중간값)를 포함
  payroll.ts severance.ts incomeTax.ts salary.ts incorporation.ts calendar.ts
  __tests__/                 골든 테스트(외부 도구 실측값·손계산 대조)
src/app/                     Next.js App Router, 정적 내보내기(output: export)
src/components/tools/        도구별 클라이언트 컴포넌트
src/content/checklists.ts    체크리스트 데이터
```

규칙
- 엔진 함수 안에 숫자 리터럴 금지. 상수는 rates 파일에서만.
- 화면의 "계산 과정"은 엔진이 돌려준 steps[]를 그대로 그린다. 산식 설명과 결과가 어긋날 수 없게.
- 도구마다 "이 계산기가 다루지 않는 것"을 결과 아래 고정 표시.
- 입력은 타이핑 즉시 반영. 포커스 이탈 시 반영 금지.
- 외부 스크립트·폰트·분석 도구 없음. 공유 링크는 URL 해시에 입력값만 담는다.

## 명령

```bash
npm install
npm test          # vitest 골든 테스트
npm run typecheck
npm run build     # out/ 에 정적 사이트 생성
npm run dev
```

## 갱신 리듬

| 시기 | 대상 |
|---|---|
| 1월 | 소득세·법인세율, 공제 한도, 건강보험·장기요양 요율, 세무 캘린더 |
| 7월 | 국민연금 기준소득월액 상·하한, 다음 해 최저임금 |
| 12월 | 다음 해 rates 파일 확정, proposed → confirmed |

갱신 시 `src/app/changelog/page.tsx`에 날짜·변경 상수·출처를 남긴다.

## 확인 필요 표기(2026-11-05 기준)

- 2026 사업연도 법인세율 1%p 인상분: 공포본 재확인
- 2026 공휴일 목록: 관보 대조
- 국민연금 상한 6,370,000원: 2026-07 고시 뒤 교체

## 기여·제보

틀린 숫자를 보셨다면 이슈로 알려 주세요. "계산 과정" 펼침에서 어느 줄이 틀렸는지와 근거 조문을 적어 주시면 가장 빠릅니다. 상수 변경 PR에는 출처 URL이 있어야 합니다.

## 라이선스

MIT. 세무·노무 결과는 참고용이며 개별 판단은 자격사와 확인하십시오.
