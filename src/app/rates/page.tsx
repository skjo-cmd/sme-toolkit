import type { Metadata } from "next";
import rates from "@/rates/2026.json";

export const metadata: Metadata = { title: "적용 세율·요율표", description: "이 사이트의 모든 계산기가 읽는 2026년 세율·요율·한도와 출처." };

const pct = (r: number) => `${Number((r * 100).toFixed(4))}%`;
const won = (n: number | null) => n === null ? "초과" : n.toLocaleString("ko-KR");
/** 구간 라벨: 이전 상한 초과 ~ 이번 상한 이하 */
const range = (prev: number | null, upTo: number | null) => upTo === null ? `${won(prev)} 초과` : prev ? `${won(prev)} 초과 ~ ${won(upTo)} 이하` : `${won(upTo)} 이하`;

export default function Page() {
  const si = rates.social_insurance;
  return (
    <>
      <h1>적용 세율·요율표 {rates.year}</h1>
      <p className="lead">모든 계산기는 이 표(<code>rates/{rates.year}.json</code>) 하나만 읽습니다. 상태: {rates.status === "confirmed" ? "확정 법령" : "정부안 포함"} · 기준일 {rates.effective_from} · 최종 검토 {rates.last_reviewed}</p>
      <div className="card"><h3>종합소득세 (소득세법 제55조)</h3><table><thead><tr><th>과세표준</th><th className="num">세율</th><th className="num">누진공제</th></tr></thead><tbody>
        {rates.income_tax.brackets.map((b, i) => <tr key={i}><td>{range(i ? rates.income_tax.brackets[i - 1].upTo : null, b.upTo)}</td><td className="num">{pct(b.rate)}</td><td className="num">{won(b.deduction)}</td></tr>)}
      </tbody></table><p className="muted">지방소득세 {pct(rates.income_tax.local_surtax_rate)} 별도. 인적공제 1인 {won(rates.income_tax.personal_deduction_per_person)}원, 표준세액공제 사업자 {won(rates.income_tax.standard_credit_business)}원·근로자 {won(rates.income_tax.standard_credit_employee)}원.</p></div>
      <div className="card"><h3>법인세 (법인세법 제55조, 2026 사업연도)</h3><table><thead><tr><th>과세표준</th><th className="num">세율</th></tr></thead><tbody>
        {rates.corp_tax.brackets.map((b, i) => <tr key={i}><td>{range(i ? rates.corp_tax.brackets[i - 1].upTo : null, b.upTo)}</td><td className="num">{pct(b.rate)}</td></tr>)}
      </tbody></table><p className="muted">{rates.corp_tax.prior_year_brackets_note}. 지방소득세 {pct(rates.corp_tax.local_surtax_rate)} 별도.</p></div>
      <div className="card"><h3>4대보험</h3><table className="kv"><tbody>
        <tr><td>국민연금</td><td>{pct(si.national_pension.total_rate)} (근로자·사업주 각 {pct(si.national_pension.employee_rate)})</td><td className="f">기준소득월액 {won(si.national_pension.income_floor)}~{won(si.national_pension.income_cap)}원 ({si.national_pension.cap_effective})</td></tr>
        <tr><td>건강보험</td><td>{pct(si.health.total_rate)} (각 {pct(si.health.employee_rate)})</td><td className="f">지역가입 소득분 {pct(si.health.regional_income_rate)}</td></tr>
        <tr><td>장기요양</td><td>건강보험료의 {pct(si.long_term_care.rate_of_health)}</td><td></td></tr>
        <tr><td>고용보험</td><td>실업급여 각 {pct(si.employment.unemployment_employee)}</td><td className="f">고용안정·직업능력(사업주) 150인 미만 {pct(si.employment.stability_employer.under150)} / 150인 이상 우선지원 {pct(si.employment.stability_employer.over150Priority)} / 150~999인 {pct(si.employment.stability_employer.from150to999)} / 1,000인 이상 {pct(si.employment.stability_employer.over1000)}</td></tr>
        <tr><td>산재보험</td><td>업종별</td><td className="f">사무·서비스 {pct(si.industrial_accident_presets.office_service)}, 제조 {pct(si.industrial_accident_presets.manufacturing)}, 건설 {pct(si.industrial_accident_presets.construction)} 등 평균값</td></tr>
        <tr><td>비과세 한도</td><td>식대 {won(si.nontaxable.meal)} / 자가운전 {won(si.nontaxable.vehicle)}</td><td className="f">월 기준</td></tr>
      </tbody></table></div>
      <div className="card"><h3>공제·한도</h3><table className="kv"><tbody>
        <tr><td>노란우산공제</td><td className="f">{rates.yellow_umbrella.limits.map((l, i, arr) => `사업소득금액 ${range(i ? arr[i - 1].businessIncomeUpTo : null, l.businessIncomeUpTo)} ${won(l.limit)}원`).join(" / ")}</td></tr>
        <tr><td>연금계좌 세액공제</td><td className="f">연금저축 {won(rates.pension_savings.pension_limit)}, IRP 합산 {won(rates.pension_savings.combined_limit_with_irp)}. 종합소득 {won(rates.pension_savings.low_rate_income_threshold_business)} 이하 {pct(rates.pension_savings.credit_rate_low)}, 초과 {pct(rates.pension_savings.credit_rate_high)}</td></tr>
        <tr><td>배당소득</td><td className="f">금융소득 {won(rates.dividend.separate_threshold)} 이하 분리과세 {pct(rates.dividend.withholding_rate)}(+지방세), 초과 종합과세·배당가산 {pct(rates.dividend.gross_up_rate)}</td></tr>
        <tr><td>최저임금</td><td className="f">시급 {won(rates.minimum_wage.hourly)}원, 월 209시간 {won(rates.minimum_wage.monthly_209h)}원</td></tr>
        <tr><td>간이과세 기준</td><td className="f">직전연도 공급대가 {won(rates.filing_thresholds.vat_simplified_annual_supply)}원 미만(배제 업종 제외)</td></tr>
      </tbody></table></div>
      <div className="card"><h3>매출 기준 요건 (소득세법 시행령)</h3><table><thead><tr><th>업종 그룹</th><th className="num">성실신고확인</th><th className="num">복식부기 의무(직전연도)</th><th className="num">단순경비율(직전연도 미만)</th></tr></thead><tbody>
        {rates.filing_thresholds.faithful_filing.map((g, i) => <tr key={i}><td>{g.group}</td><td className="num">{won(g.revenue)}</td><td className="num">{won(rates.filing_thresholds.double_entry_prior_year[i].revenue)}</td><td className="num">{won(rates.filing_thresholds.simplified_expense_rate_prior_year[i].revenue)}</td></tr>)}
      </tbody></table></div>
      <div className="card"><h3>출처</h3><ul className="notcovered">{Object.entries(rates.sources).map(([k, v]) => <li key={k}>{v}</li>)}</ul><p className="muted">{rates.notes.join(" ")}</p></div>
    </>
  );
}
