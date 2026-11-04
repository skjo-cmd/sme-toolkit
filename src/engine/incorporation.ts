import { Rates, Step, progressiveTax, won, floor10 } from "./types";
import { calcSalaryTax, earnedIncomeDeduction } from "./salary";

export interface IncorporationInput {
  netProfit: number;          // 연 순이익(세전, 대표 급여 차감 전)
  ceoSalary: number;          // 연 대표 급여(법인 전환 시)
  dividendRatio: number;      // 0~1, 세후이익 중 배당 비율
  dependents: number;         // 본인 포함
  maintenanceCost: number;    // 법인 유지비(기장료 등), 손금 반영
  includeSocialInsurance: boolean;
}

export interface SideResult { tax: number; socialInsurance: number; total: number; lines: Step[] }

export interface IncorporationResult {
  individual: SideResult;
  corporate: SideResult & { corpTaxableIncome: number; corpTax: number; corpLocalTax: number; afterTaxProfit: number; dividend: number; retained: number; salaryTax: number; dividendTax: number };
  diffTaxOnly: number;        // 양수면 법인이 유리(세금만)
  diffTotal: number;          // 사회보험 포함
  fiveYearDiff: number;
  retainedWarning: boolean;
  steps: Step[];
  notCovered: string[];
}

function regionalHealthAnnual(annualIncome: number, rates: Rates) {
  const si = rates.social_insurance;
  const monthly = Math.max(0, annualIncome / 12);
  const health = floor10(monthly * si.health.regional_income_rate);
  const care = floor10(health * si.long_term_care.rate_of_health);
  return (health + care) * 12;
}

function regionalPensionAnnual(annualIncome: number, rates: Rates) {
  const np = rates.social_insurance.national_pension;
  const monthly = Math.min(Math.max(annualIncome / 12, np.income_floor), np.income_cap);
  return floor10(monthly * np.total_rate) * 12;
}

/** 대표이사(직장가입, 고용·산재 제외) 본인+법인 부담 합계 */
function ceoWorkplaceInsuranceAnnual(annualSalary: number, rates: Rates) {
  if (annualSalary <= 0) return 0;
  const si = rates.social_insurance;
  const np = si.national_pension;
  const monthly = annualSalary / 12;
  const pensionBase = Math.min(Math.max(monthly, np.income_floor), np.income_cap);
  const pension = floor10(pensionBase * np.employee_rate) + floor10(pensionBase * np.employer_rate);
  const health = floor10(monthly * si.health.employee_rate) + floor10(monthly * si.health.employer_rate);
  const care = floor10(floor10(monthly * si.health.employee_rate) * si.long_term_care.rate_of_health) * 2;
  return (pension + health + care) * 12;
}

/**
 * 배당소득세(소득세법 제62조 비교과세).
 * 급여와 합산해 종합과세한 세액에서 급여만의 세액을 뺀 증가분을 "배당으로 인한 세금"으로 본다.
 */
function dividendTax(dividend: number, salary: number, dependents: number, rates: Rates) {
  if (dividend <= 0) return { tax: 0, method: "없음" as const, lines: [] as Step[] };
  const dv = rates.dividend;
  const it = rates.income_tax;
  const withholding = dv.withholding_rate * (1 + it.local_surtax_rate);
  if (dividend <= dv.separate_threshold) {
    const t = won(dividend * withholding);
    return { tax: t, method: "분리과세" as const, lines: [{ label: "배당소득세(분리과세 14% + 지방세)", value: t, unit: "원" as const, formula: `${dividend.toLocaleString()} × ${(withholding * 100).toFixed(1)}%` }] };
  }
  const over = dividend - dv.separate_threshold;
  const grossUp = won(over * dv.gross_up_rate);
  // 종합과세: 근로소득금액 + 배당소득금액(초과분 + 가산) 를 과세표준에 포함
  const earned = Math.max(0, salary - earnedIncomeDeduction(salary, rates));
  const personal = Math.max(1, dependents) * it.personal_deduction_per_person;
  const baseAll = Math.max(0, earned + over + grossUp - personal);
  const baseSalaryOnly = Math.max(0, earned - personal);
  const taxAll = progressiveTax(baseAll, it.brackets).tax;
  const taxSalaryOnly = progressiveTax(baseSalaryOnly, it.brackets).tax;
  const comprehensive = taxAll - taxSalaryOnly - grossUp + won(dv.separate_threshold * dv.withholding_rate); // 초과분 종합과세 + 기준금액 14%
  const separateAll = won(dividend * dv.withholding_rate);
  const national = Math.max(comprehensive, separateAll); // 비교과세: 큰 쪽
  const tax = won(national * (1 + it.local_surtax_rate));
  return {
    tax, method: "종합과세(비교과세)" as const,
    lines: [
      { label: "2,000만 원 초과 배당", value: over, unit: "원" as const },
      { label: "배당가산(Gross-up) 10%", value: grossUp, unit: "원" as const },
      { label: "급여+배당 종합과세 산출세액 증가분 − 배당세액공제", value: won(taxAll - taxSalaryOnly - grossUp), unit: "원" as const },
      { label: "기준금액 2,000만 × 14%", value: won(dv.separate_threshold * dv.withholding_rate), unit: "원" as const },
      { label: "비교과세 후 배당 소득세(지방세 포함)", value: tax, unit: "원" as const, note: `적용: ${comprehensive >= separateAll ? "종합과세" : "전액 14% 분리과세 상당액"}` },
    ],
  };
}

export function calcIncorporation(input: IncorporationInput, rates: Rates): IncorporationResult {
  const it = rates.income_tax;
  const ct = rates.corp_tax;
  const personal = Math.max(1, input.dependents) * it.personal_deduction_per_person;

  // 개인 유지
  const indBase = Math.max(0, input.netProfit - personal);
  const indComputed = progressiveTax(indBase, it.brackets).tax;
  const indDetermined = Math.max(0, indComputed - it.standard_credit_business);
  const indLocal = won(indDetermined * it.local_surtax_rate);
  const indTax = indDetermined + indLocal;
  const indSI = input.includeSocialInsurance ? regionalHealthAnnual(input.netProfit, rates) + regionalPensionAnnual(input.netProfit, rates) : 0;
  const individual: SideResult = {
    tax: indTax, socialInsurance: indSI, total: indTax + indSI,
    lines: [
      { label: "과세표준", value: indBase, unit: "원", formula: "순이익 − 인적공제" },
      { label: "종합소득세(표준세액공제 7만 차감)", value: indDetermined, unit: "원" },
      { label: "지방소득세", value: indLocal, unit: "원" },
      { label: "지역가입 건강·장기요양(소득분)", value: input.includeSocialInsurance ? regionalHealthAnnual(input.netProfit, rates) : 0, unit: "원", note: "재산분 미반영" },
      { label: "지역가입 국민연금", value: input.includeSocialInsurance ? regionalPensionAnnual(input.netProfit, rates) : 0, unit: "원" },
    ],
  };

  // 법인 전환
  const corpTaxableIncome = Math.max(0, input.netProfit - input.ceoSalary - input.maintenanceCost);
  const corpTax = progressiveTax(corpTaxableIncome, ct.brackets).tax;
  const corpLocalTax = won(corpTax * ct.local_surtax_rate);
  const afterTaxProfit = corpTaxableIncome - corpTax - corpLocalTax;
  const dividend = won(afterTaxProfit * Math.min(1, Math.max(0, input.dividendRatio)));
  const retained = afterTaxProfit - dividend;
  const salaryTaxRes = calcSalaryTax(input.ceoSalary, input.dependents, rates);
  const divRes = dividendTax(dividend, input.ceoSalary, input.dependents, rates);
  // 무보수 대표는 직장가입이 안 되어 지역가입자로 남는다. 배당소득이 연 1,000만 원을 넘으면 건보 소득에 전액 포함된다.
  const unpaidCeoRegional = input.ceoSalary <= 0 && dividend > 10_000_000 ? regionalHealthAnnual(dividend, rates) : 0;
  const corpSI = input.includeSocialInsurance ? ceoWorkplaceInsuranceAnnual(input.ceoSalary, rates) + unpaidCeoRegional : 0;
  const corpTaxTotal = corpTax + corpLocalTax + salaryTaxRes.total + divRes.tax;
  const corporate = {
    tax: corpTaxTotal, socialInsurance: corpSI, total: corpTaxTotal + corpSI + input.maintenanceCost,
    corpTaxableIncome, corpTax, corpLocalTax, afterTaxProfit, dividend, retained, salaryTax: salaryTaxRes.total, dividendTax: divRes.tax,
    lines: [
      { label: "법인 과세소득", value: corpTaxableIncome, unit: "원" as const, formula: "순이익 − 대표 급여 − 유지비(손금)" },
      { label: "법인세", value: corpTax, unit: "원" as const, note: "2026 사업연도 세율(2억 이하 10%)" },
      { label: "법인 지방소득세", value: corpLocalTax, unit: "원" as const },
      { label: "세후 이익(배당 가능)", value: afterTaxProfit, unit: "원" as const },
      { label: "배당금", value: dividend, unit: "원" as const, formula: `세후 이익 × ${Math.round(input.dividendRatio * 100)}%` },
      { label: "법인에 남는 유보이익", value: retained, unit: "원" as const, note: retained > 0 ? "대표 개인 소득이 아님. 꺼내는 순간 급여·배당 과세" : undefined },
      ...salaryTaxRes.steps.filter((s) => ["결정세액", "지방소득세"].includes(s.label)).map((s) => ({ ...s, label: `대표 급여 ${s.label}` })),
      ...divRes.lines,
      { label: input.ceoSalary > 0 ? "대표 4대보험(본인+법인, 고용·산재 제외)" : "무보수 대표 지역가입 건강보험(배당소득 1,000만 초과 시)", value: corpSI, unit: "원" as const },
      { label: "법인 유지비", value: input.maintenanceCost, unit: "원" as const },
    ],
  };

  const diffTaxOnly = individual.tax - corporate.tax - input.maintenanceCost;
  const diffTotal = individual.total - corporate.total;
  const steps: Step[] = [
    { label: "개인 유지 세금", value: individual.tax, unit: "원" },
    { label: "법인 전환 세금(법인세+급여세+배당세)", value: corporate.tax, unit: "원" },
    { label: "법인 유지비", value: input.maintenanceCost, unit: "원" },
    { label: "세금 기준 차이(양수면 법인 유리)", value: diffTaxOnly, unit: "원" },
    { label: "사회보험 포함 총부담 차이", value: diffTotal, unit: "원" },
  ];

  return {
    individual, corporate, diffTaxOnly, diffTotal, fiveYearDiff: diffTotal * 5,
    retainedWarning: retained > 0,
    steps,
    notCovered: [
      "전환 시점의 세금: 양도소득세 이월과세, 취득세(50% 경감·사후관리), 영업권 평가, 부가가치세 포괄양수도 요건",
      "가지급금 인정이자·상여처분, 임원 퇴직금 한도, 임원 보수 규정",
      "성실신고확인 비용과 세액공제, 중소기업 특별세액감면의 승계 여부",
      "가족 급여 분산, 배당 분산(차등배당은 증여세 쟁점)",
      "지역가입 건강보험의 재산·자동차 점수분. 소득분만 정률로 반영했다",
      "배당은 2,000만 원 초과 시 다른 금융소득과 합산되어 결과가 달라질 수 있다",
    ],
  };
}
