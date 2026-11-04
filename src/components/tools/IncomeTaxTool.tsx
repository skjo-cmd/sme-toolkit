"use client";
import rates from "@/rates/2026.json";
import { calcIncomeTax, judgeThresholds } from "@/engine/incomeTax";
import { Actions, Badges, Basis, CheckField, NotCovered, NumberField, Plain, SelectField, Steps, fmt, useShared } from "@/lib/ui";

type S = { revenue: number; expenses: number; prior: number; group: number; dependents: number; yu: number; pension: number; irp: number; otherDed: number; otherCredit: number; prepaid: number; eFiling: boolean; itemized: boolean };

export default function IncomeTaxTool() {
  const [s, set, link] = useShared<S>({ revenue: 300_000_000, expenses: 200_000_000, prior: 250_000_000, group: 1, dependents: 1, yu: 0, pension: 0, irp: 0, otherDed: 0, otherCredit: 0, prepaid: 0, eFiling: true, itemized: false });
  const income = Math.max(0, s.revenue - s.expenses);
  const r = calcIncomeTax({ businessIncome: income, dependents: s.dependents, yellowUmbrella: s.yu, pensionSavings: s.pension, irp: s.irp, otherIncomeDeductions: s.otherDed, otherTaxCredits: s.otherCredit, prepaidTax: s.prepaid, eFiling: s.eFiling, hasItemizedCredits: s.itemized }, rates);
  const base = calcIncomeTax({ businessIncome: income, dependents: s.dependents, yellowUmbrella: 0, pensionSavings: 0, irp: 0, otherIncomeDeductions: s.otherDed, otherTaxCredits: s.otherCredit, prepaidTax: s.prepaid, eFiling: s.eFiling, hasItemizedCredits: s.itemized }, rates);
  const saving = base.totalTax - r.totalTax;
  const j = judgeThresholds(s.group, s.revenue, s.prior, rates);
  const groups = rates.filing_thresholds.faithful_filing.map((g, i) => ({ value: i, label: g.group }));
  return (
    <>
      <h1>종합소득세 계산기 (기장 기준)</h1>
      <p className="lead">5월에 통보받고 놀라지 않으려면 지금 숫자를 봐야 합니다. 올해 예상 수입과 경비로 세금을 미리 보고, 12월 31일 전에 할 수 있는 절세를 확인합니다.</p>
      <Badges level="실무" />
      <Plain>세금은 매출이 아니라 "수입 − 경비 − 공제"에 매깁니다. 세율은 계단이라 소득이 구간을 넘어도 넘은 부분에만 높은 세율이 붙습니다. 노란우산·연금계좌 납입은 12월 31일까지 해야 올해 세금에서 빠집니다.</Plain>

      <div className="card">
        <h3>수입·경비</h3>
        <div className="grid">
          <NumberField label="올해 수입금액(매출, 부가세 제외)" value={s.revenue} onChange={(v) => set({ ...s, revenue: v })} />
          <NumberField label="필요경비(장부 기준)" value={s.expenses} onChange={(v) => set({ ...s, expenses: v })} hint="인건비·임차료·재료비·감가상각 등 장부에 적힌 경비" />
          <NumberField label="직전연도 수입금액" value={s.prior} onChange={(v) => set({ ...s, prior: v })} hint="추계·복식부기 요건 판정용" />
          <SelectField label="업종 그룹" value={s.group} onChange={(v) => set({ ...s, group: v })} options={groups} />
        </div>
        <h3>공제</h3>
        <div className="grid">
          <NumberField label="인적공제 인원(본인 포함)" suffix="명" value={s.dependents} onChange={(v) => set({ ...s, dependents: v })} />
          <NumberField label="노란우산공제 납입(연)" value={s.yu} onChange={(v) => set({ ...s, yu: v })} hint={`한도 ${fmt(r.yellowUmbrellaLimit)}원(사업소득금액 구간별)`} />
          <NumberField label="연금저축 납입(연)" value={s.pension} onChange={(v) => set({ ...s, pension: v })} hint="공제 한도 600만" />
          <NumberField label="IRP 납입(연)" value={s.irp} onChange={(v) => set({ ...s, irp: v })} hint="연금저축 합산 900만" />
          <NumberField label="기타 소득공제" value={s.otherDed} onChange={(v) => set({ ...s, otherDed: v })} hint="국민연금 납입액(지역가입 본인 부담 전액) 등" />
          <NumberField label="기타 세액공제" value={s.otherCredit} onChange={(v) => set({ ...s, otherCredit: v })} hint="자녀세액공제, 기장세액공제 등 금액을 아는 경우" />
          <NumberField label="기납부세액(중간예납·원천징수)" value={s.prepaid} onChange={(v) => set({ ...s, prepaid: v })} />
        </div>
        <CheckField label="전자신고 세액공제 2만 원" checked={s.eFiling} onChange={(v) => set({ ...s, eFiling: v })} hint="본인이 직접 홈택스로 신고할 때" />
        <CheckField label="보험료·의료비·교육비·기부금 특별세액공제를 받음" checked={s.itemized} onChange={(v) => set({ ...s, itemized: v })} hint="체크하면 표준세액공제 7만 원은 빠집니다" />
      </div>

      <div className="result">
        <div className="kpi"><div className="k">사업소득금액</div><div className="v">{fmt(income)}원</div></div>
        <div className="kpi"><div className="k">과세표준</div><div className="v">{fmt(r.taxableBase)}원</div></div>
        <div className="kpi"><div className="k">총 세금(지방세 포함)</div><div className="v">{fmt(r.totalTax)}원</div></div>
        <div className="kpi"><div className="k">실효세율(소득금액 대비)</div><div className="v">{(r.effectiveRate * 100).toFixed(1)}%</div></div>
      </div>
      <p className="muted">한계세율 {Math.round(r.marginalRate * 100)}%. 기납부세액 차감 후 {r.payable >= 0 ? "납부" : "환급"}할 세액 {fmt(Math.abs(r.payable))}원.</p>
      {saving > 0 && <div className="ok">입력한 노란우산·연금계좌 납입으로 올해 세금이 {fmt(saving)}원 줄어듭니다. 납입은 12월 31일까지.</div>}

      <div className="card">
        <h3>요건 판정 (세액이 아니라 해당 여부만)</h3>
        <table>
          <tbody>
            <tr><td>성실신고확인 대상</td><td>{j.faithfulFiling ? "해당" : "비해당"}</td><td className="f">올해 수입 {fmt(j.faithfulThreshold)}원 이상 · 신고기한 6월 30일, 확인비용 세액공제</td></tr>
            <tr><td>복식부기 의무</td><td>{j.doubleEntryRequired ? "의무" : "간편장부 가능"}</td><td className="f">직전연도 수입 {fmt(j.doubleEntryThreshold)}원 이상</td></tr>
            <tr><td>단순경비율 추계 가능</td><td>{j.simplifiedRateEligible ? "가능" : "불가"}</td><td className="f">직전연도 수입 {fmt(j.simplifiedThreshold)}원 미만. 불가하면 기준경비율 또는 기장</td></tr>
          </tbody>
        </table>
        <p className="muted">신규 사업자는 당해연도 수입 기준으로 다릅니다. 업종 그룹 분류는 소득세법 시행령 제208조 기준이며 세부 업종은 세무사와 확인하세요.</p>
      </div>

      <Steps steps={r.steps} />
      <Actions link={link} />
      <NotCovered items={r.notCovered} />
      <Basis items={[rates.sources.income_tax, rates.sources.yellow_umbrella, rates.sources.pension_credit, rates.sources.filing_thresholds]} />
    </>
  );
}
