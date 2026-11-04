"use client";
import rates from "@/rates/2026.json";
import { calcPayroll, type EmployerUnempTier } from "@/engine/payroll";
import { Actions, Badges, Basis, CheckField, NotCovered, NumberField, Plain, SelectField, Steps, fmt, useShared } from "@/lib/ui";

type S = { basePay: number; meal: number; vehicle: number; other: number; tier: EmployerUnempTier; preset: string; customRate: number };
const presets = rates.social_insurance.industrial_accident_presets as Record<string, number>;
const presetLabels: Record<string, string> = { office_service: "사무·서비스업 평균 1.47%", retail_food_lodging: "도소매·음식·숙박 0.9%", manufacturing: "제조업 1.3%", construction: "건설업 3.6%", transport_warehouse: "운수·창고 1.8%", agriculture: "농림어업 2.2%", custom: "직접 입력" };

export default function PayrollTool() {
  const [s, set, link] = useShared<S>({ basePay: 3_000_000, meal: 200_000, vehicle: 0, other: 0, tier: "under150", preset: "office_service", customRate: 1.0 });
  const rate = s.preset === "custom" ? s.customRate / 100 : presets[s.preset];
  const r = calcPayroll({ basePay: s.basePay, mealAllowance: s.meal, vehicleAllowance: s.vehicle, otherNonTaxable: s.other, employerTier: s.tier, industrialRate: rate }, rates);
  const np = rates.social_insurance.national_pension;
  return (
    <>
      <h1>인건비 총액 계산기</h1>
      <p className="lead">직원 한 명의 월급이 300만 원이면 회사 통장에서는 그보다 많이 나갑니다. 얼마가 더 나가는지, 직원 통장에는 얼마가 들어가는지 봅니다.</p>
      <Badges level="기초" />
      <Plain>4대보험은 직원과 회사가 나눠 냅니다. 국민연금·건강보험은 반반, 고용보험은 회사가 조금 더, 산재보험은 회사만 냅니다. 식대 같은 비과세 수당은 보험료 계산에서 빠집니다.</Plain>

      <div className="card">
        <div className="grid">
          <NumberField label="월 기본급(비과세 포함 총액)" value={s.basePay} onChange={(v) => set({ ...s, basePay: v })} />
          <NumberField label="식대" value={s.meal} onChange={(v) => set({ ...s, meal: v })} hint={`월 ${fmt(rates.social_insurance.nontaxable.meal)}원까지 비과세`} />
          <NumberField label="자가운전보조금" value={s.vehicle} onChange={(v) => set({ ...s, vehicle: v })} hint={`월 ${fmt(rates.social_insurance.nontaxable.vehicle)}원까지 비과세(본인 차량 업무 사용 시)`} />
          <NumberField label="기타 비과세" value={s.other} onChange={(v) => set({ ...s, other: v })} hint="육아수당·연구보조비 등 요건 충족분만" />
          <SelectField label="사업장 규모(고용보험 사업주 요율)" value={s.tier} onChange={(v) => set({ ...s, tier: v })} options={[
            { value: "under150", label: "150인 미만 (0.9% + 0.25%)" }, { value: "over150Priority", label: "150인 이상 우선지원대상기업 (0.9% + 0.45%)" },
            { value: "from150to999", label: "150~999인 (0.9% + 0.65%)" }, { value: "over1000", label: "1,000인 이상·국가·지자체 (0.9% + 0.85%)" }]} />
          <SelectField label="산재보험 요율" value={s.preset} onChange={(v) => set({ ...s, preset: v })} options={Object.keys(presetLabels).map((k) => ({ value: k, label: presetLabels[k] }))} hint="업종 평균. 실제는 사업장별 고시 요율" />
          {s.preset === "custom" && <NumberField label="산재 요율" suffix="%" value={s.customRate} onChange={(v) => set({ ...s, customRate: v })} />}
        </div>
      </div>

      <div className="result">
        <div className="kpi"><div className="k">근로자 공제 합계(월)</div><div className="v">{fmt(r.employee.total)}원</div></div>
        <div className="kpi"><div className="k">사업주 추가 부담(월)</div><div className="v">{fmt(r.employer.total)}원</div></div>
        <div className="kpi"><div className="k">월 총 인건비</div><div className="v">{fmt(r.monthlyTotalCost)}원</div></div>
        <div className="kpi"><div className="k">연 총 인건비(퇴직급여 적립 별도)</div><div className="v">{fmt(r.annualTotalCost)}원</div></div>
      </div>
      <p className="muted">퇴직급여 적립 추정: 연 {fmt(r.annualSeveranceReserve)}원(기본급 1개월분). 1년 이상 근속 시 지급 의무가 생기므로 미리 쌓아 두는 것이 안전합니다.</p>

      <div className="card">
        <table>
          <thead><tr><th>항목</th><th className="num">근로자</th><th className="num">사업주</th></tr></thead>
          <tbody>
            <tr><td>국민연금 ({np.employee_rate * 100}% / {np.employer_rate * 100}%)</td><td className="num">{fmt(r.employee.pension)}</td><td className="num">{fmt(r.employer.pension)}</td></tr>
            <tr><td>건강보험 (3.595% 각)</td><td className="num">{fmt(r.employee.health)}</td><td className="num">{fmt(r.employer.health)}</td></tr>
            <tr><td>장기요양 (건보의 13.14%)</td><td className="num">{fmt(r.employee.care)}</td><td className="num">{fmt(r.employer.care)}</td></tr>
            <tr><td>고용보험</td><td className="num">{fmt(r.employee.unemployment)}</td><td className="num">{fmt(r.employer.unemployment)}</td></tr>
            <tr><td>산재보험</td><td className="num">—</td><td className="num">{fmt(r.employer.industrial)}</td></tr>
            <tr><th>합계</th><th className="num">{fmt(r.employee.total)}</th><th className="num">{fmt(r.employer.total)}</th></tr>
          </tbody>
        </table>
        <p className="muted">금액은 공단 고지 방식대로 10원 미만을 절사했습니다. 실제 고지서와 수십 원 차이가 날 수 있습니다.</p>
      </div>

      <Steps steps={r.steps} />
      <Actions link={link} />
      <NotCovered items={r.notCovered} />
      <Basis items={[rates.sources.national_pension, rates.sources.health_insurance, rates.sources.long_term_care, rates.sources.employment_insurance]} />
    </>
  );
}
