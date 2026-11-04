import { Rates, Step, progressiveTax, marginalBracket, won } from "./types";

export interface IncomeTaxInput {
  /** 사업소득금액(수입 − 필요경비). 수입·경비를 따로 받는 UI는 이 값을 만들어 넘긴다 */
  businessIncome: number;
  dependents: number; // 본인 포함
  yellowUmbrella: number;
  pensionSavings: number;
  irp: number;
  otherIncomeDeductions: number;
  otherTaxCredits: number;
  prepaidTax: number; // 중간예납·원천징수
  eFiling: boolean;
  /** 특별세액공제(보험료·의료비·교육비·기부금)를 받는 경우 표준세액공제 제외 */
  hasItemizedCredits: boolean;
}

export interface IncomeTaxResult {
  businessIncome: number;
  personalDeduction: number;
  yellowUmbrellaLimit: number;
  yellowUmbrellaApplied: number;
  taxableBase: number;
  computedTax: number;
  marginalRate: number;
  perBracket: { rate: number; amount: number; tax: number }[];
  pensionCreditRate: number;
  pensionCredit: number;
  standardCredit: number;
  eFilingCredit: number;
  determinedTax: number;
  localTax: number;
  totalTax: number;
  payable: number;
  effectiveRate: number;
  steps: Step[];
  notCovered: string[];
}

export function yellowUmbrellaLimit(businessIncome: number, rates: Rates) {
  for (const t of rates.yellow_umbrella.limits) if (t.businessIncomeUpTo === null || businessIncome <= t.businessIncomeUpTo) return t.limit;
  return 0;
}

export function calcIncomeTax(input: IncomeTaxInput, rates: Rates): IncomeTaxResult {
  const it = rates.income_tax;
  const personalDeduction = Math.max(1, input.dependents) * it.personal_deduction_per_person;
  const yuLimit = yellowUmbrellaLimit(input.businessIncome, rates);
  const yuApplied = Math.min(input.yellowUmbrella, yuLimit);
  const taxableBase = Math.max(0, input.businessIncome - personalDeduction - yuApplied - input.otherIncomeDeductions);
  const { tax: computedTax, perBracket } = progressiveTax(taxableBase, it.brackets);
  const marginalRate = marginalBracket(taxableBase, it.brackets).rate;

  const ps = rates.pension_savings;
  const pensionCreditRate = input.businessIncome <= ps.low_rate_income_threshold_business ? ps.credit_rate_low : ps.credit_rate_high;
  const pensionEligible = Math.min(input.pensionSavings, ps.pension_limit);
  const combinedEligible = Math.min(pensionEligible + input.irp, ps.combined_limit_with_irp);
  const pensionCredit = won(combinedEligible * pensionCreditRate);
  const standardCredit = input.hasItemizedCredits ? 0 : it.standard_credit_business;
  const eFilingCredit = input.eFiling ? it.e_filing_credit : 0;
  const credits = pensionCredit + standardCredit + eFilingCredit + input.otherTaxCredits;
  const determinedTax = Math.max(0, computedTax - credits);
  const localTax = won(determinedTax * it.local_surtax_rate);
  const totalTax = determinedTax + localTax;
  const payable = totalTax - input.prepaidTax;
  const effectiveRate = input.businessIncome > 0 ? totalTax / input.businessIncome : 0;

  const steps: Step[] = [
    { label: "사업소득금액", value: input.businessIncome, unit: "원" },
    { label: "인적공제", value: personalDeduction, unit: "원", formula: `${Math.max(1, input.dependents)}명 × ${it.personal_deduction_per_person.toLocaleString()}` },
    { label: "노란우산공제 적용액", value: yuApplied, unit: "원", formula: `min(납입 ${input.yellowUmbrella.toLocaleString()}, 한도 ${yuLimit.toLocaleString()})`, note: "한도는 사업소득금액 구간별(조특법 제86조의3)" },
    { label: "기타 소득공제", value: input.otherIncomeDeductions, unit: "원" },
    { label: "과세표준", value: taxableBase, unit: "원", formula: "소득금액 − 소득공제 합계" },
    ...perBracket.map((b) => ({ label: `${Math.round(b.rate * 100)}% 구간 세액`, value: won(b.tax), unit: "원" as const, formula: `${b.amount.toLocaleString()} × ${Math.round(b.rate * 100)}%` })),
    { label: "산출세액", value: computedTax, unit: "원", formula: `과세표준 × ${Math.round(marginalRate * 100)}% − 누진공제 ${marginalBracket(taxableBase, it.brackets).deduction?.toLocaleString()}` },
    { label: "연금계좌 세액공제", value: pensionCredit, unit: "원", formula: `공제 대상 ${combinedEligible.toLocaleString()} × ${pensionCreditRate * 100}%`, note: "연금저축 한도 600만, IRP 합산 900만. 종합소득 4,500만 이하 15%, 초과 12%" },
    { label: "표준세액공제", value: standardCredit, unit: "원", note: "특별세액공제를 받지 않는 사업자 7만 원" },
    { label: "전자신고 세액공제", value: eFilingCredit, unit: "원" },
    { label: "기타 세액공제", value: input.otherTaxCredits, unit: "원" },
    { label: "결정세액", value: determinedTax, unit: "원", formula: "산출세액 − 세액공제 합계" },
    { label: "지방소득세", value: localTax, unit: "원", formula: `결정세액 × ${it.local_surtax_rate * 100}%` },
    { label: "총 세금", value: totalTax, unit: "원" },
    { label: "기납부세액 차감 후 납부(환급)할 세액", value: payable, unit: "원" },
  ];

  return {
    businessIncome: input.businessIncome, personalDeduction, yellowUmbrellaLimit: yuLimit, yellowUmbrellaApplied: yuApplied,
    taxableBase, computedTax, marginalRate, perBracket, pensionCreditRate, pensionCredit, standardCredit, eFilingCredit,
    determinedTax, localTax, totalTax, payable, effectiveRate, steps,
    notCovered: [
      "추계(단순경비율·기준경비율) 세액. 이 도구는 기장(실제 경비) 기준만 계산한다. 적용 요건은 아래 판정 참고",
      "성실신고확인비용 세액공제, 기장세액공제(간편장부 대상자 복식기장 시 20%)",
      "근로·연금·금융·기타소득과의 합산, 금융소득 2,000만 원 초과 종합과세",
      "자녀세액공제, 특별세액공제(보험료·의료비·교육비·기부금) 세부 계산",
      "가산세(무신고·무기장·사업용계좌 미사용 등)와 중간예납 세액 자체의 계산",
    ],
  };
}

export interface ThresholdJudgement { group: string; faithfulFiling: boolean; faithfulThreshold: number; simplifiedRateEligible: boolean; simplifiedThreshold: number; doubleEntryRequired: boolean; doubleEntryThreshold: number }

/** 매출 기준 요건 판정만 한다. 세액을 내지 않는다. */
export function judgeThresholds(groupIndex: number, currentYearRevenue: number, priorYearRevenue: number, rates: Rates): ThresholdJudgement {
  const ft = rates.filing_thresholds;
  const f = ft.faithful_filing[groupIndex];
  const s = ft.simplified_expense_rate_prior_year[groupIndex];
  const d = ft.double_entry_prior_year[groupIndex];
  return {
    group: f.group,
    faithfulFiling: currentYearRevenue >= f.revenue, faithfulThreshold: f.revenue,
    simplifiedRateEligible: priorYearRevenue < s.revenue, simplifiedThreshold: s.revenue,
    doubleEntryRequired: priorYearRevenue >= d.revenue, doubleEntryThreshold: d.revenue,
  };
}
