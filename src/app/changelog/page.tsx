import type { Metadata } from "next";

export const metadata: Metadata = { title: "변경 이력" };

const log = [
  { date: "2026-11-05", items: [
    "최초 공개. 2026년 세율·요율 상수 파일, 계산 엔진 5종(인건비·퇴직금·종합소득세·법인전환·세무 캘린더), 체크리스트 3종.",
    "골든 테스트 22건: 외부 도구 실측값(4대보험 272,080/320,240원, 퇴직금 8,812,388원, 산출세액 6,183,000원, 절세 2,728,000원)과 손계산 대조.",
    "확인 필요 표기: 2026 사업연도 법인세율 1%p 인상분은 공포본 재확인, 2026 공휴일 목록은 관보 대조, 국민연금 상한은 2026-07 고시 뒤 교체.",
  ] },
];

export default function Page() {
  return (
    <>
      <h1>변경 이력</h1>
      <p className="lead">세율·요율·산식이 바뀔 때마다 날짜와 출처를 남깁니다. 갱신 주기: 1월(세율·공제·캘린더), 7월(국민연금 상한), 연말(다음 해 상수 확정).</p>
      {log.map((l) => <div className="card" key={l.date}><h3>{l.date}</h3><ul>{l.items.map((t, i) => <li key={i}>{t}</li>)}</ul></div>)}
    </>
  );
}
