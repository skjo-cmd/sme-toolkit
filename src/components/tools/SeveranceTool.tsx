"use client";
import rates from "@/rates/2026.json";
import { calcSeverance } from "@/engine/severance";
import { Actions, Badges, Basis, NotCovered, NumberField, Plain, Steps, fmt, useShared } from "@/lib/ui";

type S = { hire: string; leave: string; m1: number; m2: number; m3: number; bonus: number; leavePay: number; ordinary: number };

export default function SeveranceTool() {
  const [s, set, link] = useShared<S>({ hire: "2023-01-01", leave: "2026-01-01", m1: 3_000_000, m2: 3_000_000, m3: 3_000_000, bonus: 0, leavePay: 0, ordinary: 0 });
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(s.hire) && /^\d{4}-\d{2}-\d{2}$/.test(s.leave) && s.leave > s.hire;
  const r = valid ? calcSeverance({ hireDate: s.hire, leaveDate: s.leave, lastThreeMonthsWages: s.m1 + s.m2 + s.m3, annualBonus: s.bonus, annualLeavePay: s.leavePay, ordinaryDailyWage: s.ordinary || undefined }) : null;
  return (
    <>
      <h1>퇴직금 계산기</h1>
      <p className="lead">1년 이상 일한 직원이 그만두면 14일 안에 퇴직금을 줘야 합니다. 얼마인지 미리 보고, 매달 얼마를 쌓아야 하는지 가늠합니다.</p>
      <Badges level="기초" />
      <Plain>퇴직금은 "마지막 3개월 평균 하루 임금 × 30일 × 근속연수"입니다. 상여금과 연차수당은 1년치의 3/12만 3개월 임금에 더합니다. 평균임금이 통상임금보다 낮으면 통상임금으로 계산합니다.</Plain>

      <div className="card">
        <div className="grid">
          <div className="field"><label>입사일</label><input type="date" value={s.hire} onChange={(e) => set({ ...s, hire: e.target.value })} /></div>
          <div className="field"><label>퇴직일(마지막 근무일 다음날)</label><input type="date" value={s.leave} onChange={(e) => set({ ...s, leave: e.target.value })} /><span className="hint">12월 31일까지 근무했으면 다음 해 1월 1일</span></div>
          <NumberField label="퇴직 전 3개월 중 첫째 달 임금" value={s.m1} onChange={(v) => set({ ...s, m1: v })} hint="기본급 + 고정수당. 식대 등 비과세 제외" />
          <NumberField label="둘째 달 임금" value={s.m2} onChange={(v) => set({ ...s, m2: v })} />
          <NumberField label="셋째 달 임금" value={s.m3} onChange={(v) => set({ ...s, m3: v })} />
          <NumberField label="퇴직 전 1년간 상여금 총액" value={s.bonus} onChange={(v) => set({ ...s, bonus: v })} hint="3/12만 반영" />
          <NumberField label="퇴직 전 1년간 연차수당" value={s.leavePay} onChange={(v) => set({ ...s, leavePay: v })} hint="전전년도 발생분 수당. 3/12만 반영" />
          <NumberField label="1일 통상임금(선택)" value={s.ordinary} onChange={(v) => set({ ...s, ordinary: v })} hint="월 통상임금 ÷ 209 × 8. 모르면 비워 두세요" />
        </div>
      </div>

      {r ? (
        <>
          <div className="result">
            <div className="kpi"><div className="k">재직기간</div><div className="v">{r.serviceDays.toLocaleString()}일 ({r.serviceYears.toFixed(2)}년)</div></div>
            <div className="kpi"><div className="k">1일 평균임금</div><div className="v">{fmt(r.averageDailyWage)}원</div></div>
            <div className="kpi"><div className="k">퇴직금</div><div className="v">{fmt(r.severance)}원</div></div>
          </div>
          {!r.eligible && <div className="warn">계속근로 1년 미만은 법정 퇴직금 지급 의무가 없습니다(근로자퇴직급여 보장법 제4조). 취업규칙·계약으로 정한 것이 있으면 그에 따릅니다.</div>}
          {r.usedOrdinaryWage && <div className="warn">평균임금이 통상임금보다 낮아 통상임금으로 계산했습니다(근로기준법 제2조 제2항).</div>}
          <div className="ok">퇴직일로부터 14일 이내 지급(근로기준법 제36조). 합의로 연장 가능. 퇴직소득세는 별도로 원천징수됩니다.</div>
          <Steps steps={r.steps} />
          <Actions link={link} />
          <NotCovered items={r.notCovered} />
        </>
      ) : <div className="warn">퇴직일이 입사일보다 뒤여야 합니다.</div>}
      <Basis items={[rates.sources.severance, "근로기준법 제36조(금품 청산)"]} />
    </>
  );
}
