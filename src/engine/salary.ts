import { Rates, Step, progressiveTax, won } from "./types";

/** 근로소득공제(소득세법 제47조) */
export function earnedIncomeDeduction(salary: number, rates: Rates) {
  const tiers = rates.earned_income.deduction;
  let d = 0;
  for (const t of tiers) {
    if (t.upTo === null || salary <= t.upTo) { d = t.base + (salary - t.over) * t.rate; break; }
  }
  return Math.min(won(d), rates.earned_income.deduction_cap);
}

/** 근로소득세액공제(소득세법 제59조) */
export function earnedIncomeCredit(salary: number, computedTax: number, rates: Rates) {
  const c = rates.earned_income.credit;
  const raw = computedTax <= c.threshold ? computedTax * c.rate_below : c.base_above + (computedTax - c.threshold) * c.rate_above;
  let cap = c.caps[c.caps.length - 1].cap;
  for (const t of c.caps) {
    if (t.salaryUpTo === null || salary <= t.salaryUpTo) {
      cap = t.slope === 0 ? t.cap : Math.max(t.floor, t.cap - (salary - (t.from ?? 0)) * t.slope);
      break;
    }
  }
  return won(Math.min(raw, cap));
}

export interface SalaryTaxResult { salary: number; deduction: number; earnedIncome: number; personalDeduction: number; taxableBase: number; computedTax: number; credit: number; standardCredit: number; determinedTax: number; localTax: number; total: number; steps: Step[] }

/** 급여만 있는 대표·근로자의 연간 소득세(간이세액표가 아닌 연말정산 기준 확정치) */
export function calcSalaryTax(salary: number, dependents: number, rates: Rates, extraIncomeForBase = 0): SalaryTaxResult {
  const it = rates.income_tax;
  const deduction = earnedIncomeDeduction(salary, rates);
  const earnedIncome = Math.max(0, salary - deduction);
  const personalDeduction = Math.max(1, dependents) * it.personal_deduction_per_person;
  const taxableBase = Math.max(0, earnedIncome + extraIncomeForBase - personalDeduction);
  const { tax: computedTax } = progressiveTax(taxableBase, it.brackets);
  const credit = salary > 0 ? earnedIncomeCredit(salary, computedTax, rates) : 0;
  const standardCredit = salary > 0 ? it.standard_credit_employee : 0;
  const determinedTax = Math.max(0, computedTax - credit - standardCredit);
  const localTax = won(determinedTax * it.local_surtax_rate);
  const steps: Step[] = [
    { label: "총급여", value: salary, unit: "원" },
    { label: "근로소득공제", value: deduction, unit: "원", note: "소득세법 제47조, 한도 2,000만" },
    { label: "근로소득금액", value: earnedIncome, unit: "원" },
    { label: "인적공제", value: personalDeduction, unit: "원" },
    { label: "과세표준", value: taxableBase, unit: "원" },
    { label: "산출세액", value: computedTax, unit: "원" },
    { label: "근로소득세액공제", value: credit, unit: "원", note: "소득세법 제59조, 총급여 구간별 한도" },
    { label: "표준세액공제(근로자)", value: standardCredit, unit: "원" },
    { label: "결정세액", value: determinedTax, unit: "원" },
    { label: "지방소득세", value: localTax, unit: "원" },
  ];
  return { salary, deduction, earnedIncome, personalDeduction, taxableBase, computedTax, credit, standardCredit, determinedTax, localTax, total: determinedTax + localTax, steps };
}
