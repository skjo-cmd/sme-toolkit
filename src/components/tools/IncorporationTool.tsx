"use client";
import rates from "@/rates/2026.json";
import { calcIncorporation } from "@/engine/incorporation";
import { Actions, Badges, Basis, CheckField, NotCovered, NumberField, Plain, Steps, fmt, fmtMan, useShared } from "@/lib/ui";

type S = { profit: number; salary: number; dividend: number; dependents: number; maint: number; si: boolean };

export default function IncorporationTool() {
  const [s, set, link] = useShared<S>({ profit: 180_000_000, salary: 60_000_000, dividend: 50, dependents: 1, maint: rates.incorporation_defaults.annual_maintenance_cost, si: true });
  const r = calcIncorporation({ netProfit: s.profit, ceoSalary: s.salary, dividendRatio: s.dividend / 100, dependents: s.dependents, maintenanceCost: s.maint, includeSocialInsurance: s.si }, rates);
  const r0 = calcIncorporation({ netProfit: s.profit, ceoSalary: s.salary, dividendRatio: 0, dependents: s.dependents, maintenanceCost: s.maint, includeSocialInsurance: s.si }, rates);
  const r100 = calcIncorporation({ netProfit: s.profit, ceoSalary: s.salary, dividendRatio: 1, dependents: s.dependents, maintenanceCost: s.maint, includeSocialInsurance: s.si }, rates);
  const favorable = r.diffTotal > 0;
  return (
    <>
      <h1>법인전환 손익분기</h1>
      <p className="lead">"법인세율이 낮으니 법인이 유리하다"는 절반만 맞는 말입니다. 법인의 돈은 대표의 돈이 아니고, 꺼내는 순간 급여세나 배당세가 붙습니다. 꺼내는 것까지 넣고 비교합니다.</p>
      <Badges level="심화" />
      <Plain>개인사업자는 이익 전체에 소득세를 냅니다. 법인은 법인세를 내고 남은 돈을 급여나 배당으로 가져가며 그때 다시 세금을 냅니다. 이익을 법인에 그냥 두면 세금이 적어 보이지만 그 돈은 아직 내 돈이 아닙니다. 아래에서 배당 비율을 0%와 100%로 움직여 보면 차이가 보입니다.</Plain>

      <div className="card">
        <div className="grid">
          <NumberField label="연 순이익(세전, 대표 급여 차감 전)" value={s.profit} onChange={(v) => set({ ...s, profit: v })} />
          <NumberField label="법인 전환 시 대표 급여(연)" value={s.salary} onChange={(v) => set({ ...s, salary: v })} hint="0이면 무보수 대표(지역가입자로 남음)" />
          <NumberField label="세후 이익 중 배당 비율" suffix="%" value={s.dividend} onChange={(v) => set({ ...s, dividend: Math.min(100, v) })} hint="0% = 전액 유보, 100% = 전액 인출" />
          <NumberField label="인적공제 인원(본인 포함)" suffix="명" value={s.dependents} onChange={(v) => set({ ...s, dependents: v })} />
          <NumberField label="법인 유지비(연, 기장·결산·등기 등)" value={s.maint} onChange={(v) => set({ ...s, maint: v })} hint="손금으로 반영됩니다" />
        </div>
        <CheckField label="건강보험·국민연금 차이까지 포함" checked={s.si} onChange={(v) => set({ ...s, si: v })} hint="개인은 지역가입(소득분), 법인 대표는 직장가입" />
      </div>

      <div className="result">
        <div className="kpi"><div className="k">개인 유지 총부담</div><div className="v">{fmtMan(r.individual.total)}</div></div>
        <div className="kpi"><div className="k">법인 전환 총부담(유지비 포함)</div><div className="v">{fmtMan(r.corporate.total)}</div></div>
        <div className="kpi"><div className="k">연간 차이</div><div className="v">{favorable ? "법인 유리 " : "개인 유리 "}{fmtMan(Math.abs(r.diffTotal))}</div></div>
        <div className="kpi"><div className="k">5년 누적</div><div className="v">{fmtMan(Math.abs(r.fiveYearDiff))}</div></div>
      </div>

      {r.retainedWarning && (
        <div className="warn">법인에 {fmtMan(r.corporate.retained)}이 남습니다. 이 돈은 대표 개인 소득이 아닙니다. 꺼낼 때 급여(소득세·4대보험) 또는 배당(배당소득세)이 붙고, 개인 용도로 쓰면 가지급금이 됩니다. 배당 비율 100%의 결과가 "실제로 다 가져갈 때"의 숫자입니다.</div>
      )}

      <div className="card">
        <h3>배당 비율에 따른 차이(같은 급여 기준)</h3>
        <table>
          <thead><tr><th>배당 비율</th><th className="num">법인 총부담</th><th className="num">개인 대비</th><th>해석</th></tr></thead>
          <tbody>
            <tr><td>0% (전액 유보)</td><td className="num">{fmtMan(r0.corporate.total)}</td><td className="num">{r0.diffTotal >= 0 ? "법인 유리 " : "개인 유리 "}{fmtMan(Math.abs(r0.diffTotal))}</td><td className="f">세금은 적지만 돈은 법인에 묶임</td></tr>
            <tr><td>{s.dividend}% (입력값)</td><td className="num">{fmtMan(r.corporate.total)}</td><td className="num">{r.diffTotal >= 0 ? "법인 유리 " : "개인 유리 "}{fmtMan(Math.abs(r.diffTotal))}</td><td className="f"></td></tr>
            <tr><td>100% (전액 인출)</td><td className="num">{fmtMan(r100.corporate.total)}</td><td className="num">{r100.diffTotal >= 0 ? "법인 유리 " : "개인 유리 "}{fmtMan(Math.abs(r100.diffTotal))}</td><td className="f">개인사업자와 같은 조건으로 다 가져갈 때</td></tr>
          </tbody>
        </table>
      </div>

      <div className="grid">
        <div className="card">
          <h3>개인 유지</h3>
          <table><tbody>{r.individual.lines.map((l, i) => <tr key={i}><td>{l.label}</td><td className="num">{fmt(l.value)}원</td></tr>)}</tbody></table>
          <p className="muted">합계 세금 {fmt(r.individual.tax)}원 + 사회보험 {fmt(r.individual.socialInsurance)}원</p>
        </div>
        <div className="card">
          <h3>법인 전환</h3>
          <table><tbody>{r.corporate.lines.map((l, i) => <tr key={i}><td>{l.label}{l.note ? <span className="f"> · {l.note}</span> : null}</td><td className="num">{fmt(l.value)}원</td></tr>)}</tbody></table>
          <p className="muted">합계 세금 {fmt(r.corporate.tax)}원 + 사회보험 {fmt(r.corporate.socialInsurance)}원 + 유지비 {fmt(s.maint)}원</p>
        </div>
      </div>

      <Steps steps={r.steps} />
      <Actions link={link} />
      <NotCovered items={r.notCovered} />
      <Basis items={[rates.sources.corp_tax, rates.sources.income_tax, rates.sources.earned_income_deduction, rates.sources.dividend, rates.sources.health_insurance]} />
    </>
  );
}
