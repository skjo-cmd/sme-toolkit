import { Rates, Step, floor10, pctStr } from "./types";

export type EmployerUnempTier = "under150" | "over150Priority" | "from150to999" | "over1000";

export interface PayrollInput {
  basePay: number;
  mealAllowance: number;
  vehicleAllowance: number;
  otherNonTaxable: number;
  employerTier: EmployerUnempTier;
  /** 산재보험 요율(소수, 예: 0.0147) */
  industrialRate: number;
}

export interface PayrollResult {
  taxableBase: number;
  pensionBase: number;
  employee: { pension: number; health: number; care: number; unemployment: number; total: number };
  employer: { pension: number; health: number; care: number; unemployment: number; industrial: number; total: number };
  monthlyTotalCost: number;
  annualTotalCost: number;
  annualSeveranceReserve: number;
  steps: Step[];
  notCovered: string[];
}

export function calcPayroll(input: PayrollInput, rates: Rates): PayrollResult {
  const si = rates.social_insurance;
  const meal = Math.min(input.mealAllowance, si.nontaxable.meal);
  const vehicle = Math.min(input.vehicleAllowance, si.nontaxable.vehicle);
  const taxableBase = Math.max(0, input.basePay - meal - vehicle - input.otherNonTaxable);
  const np = si.national_pension;
  const pensionBase = Math.min(Math.max(taxableBase, np.income_floor), np.income_cap);

  const empPension = floor10(pensionBase * np.employee_rate);
  const erPension = floor10(pensionBase * np.employer_rate);
  const empHealth = floor10(taxableBase * si.health.employee_rate);
  const erHealth = floor10(taxableBase * si.health.employer_rate);
  const empCare = floor10(empHealth * si.long_term_care.rate_of_health);
  const erCare = floor10(erHealth * si.long_term_care.rate_of_health);
  const empUnemp = floor10(taxableBase * si.employment.unemployment_employee);
  const erUnemp = floor10(
    taxableBase * (si.employment.unemployment_employer + si.employment.stability_employer[input.employerTier])
  );
  const erIndustrial = floor10(taxableBase * input.industrialRate);

  const employee = {
    pension: empPension, health: empHealth, care: empCare, unemployment: empUnemp,
    total: empPension + empHealth + empCare + empUnemp,
  };
  const employer = {
    pension: erPension, health: erHealth, care: erCare, unemployment: erUnemp, industrial: erIndustrial,
    total: erPension + erHealth + erCare + erUnemp + erIndustrial,
  };
  const monthlyTotalCost = input.basePay + employer.total;
  const annualSeveranceReserve = Math.round(input.basePay);

  const stabilityRate = si.employment.stability_employer[input.employerTier];
  const steps: Step[] = [
    { label: "비과세 식대 인정액", value: meal, unit: "원", formula: `min(입력 ${input.mealAllowance.toLocaleString()}, 한도 ${si.nontaxable.meal.toLocaleString()})` },
    { label: "비과세 자가운전보조 인정액", value: vehicle, unit: "원", formula: `min(입력, 한도 ${si.nontaxable.vehicle.toLocaleString()})` },
    { label: "보험료 부과 기준 보수", value: taxableBase, unit: "원", formula: "기본급 − 비과세 합계" },
    { label: "국민연금 기준소득월액", value: pensionBase, unit: "원", formula: `하한 ${np.income_floor.toLocaleString()} ~ 상한 ${np.income_cap.toLocaleString()} 범위로 제한`, note: np.cap_effective },
    { label: "국민연금(근로자·사업주 각)", value: empPension, unit: "원", formula: `기준소득월액 × ${pctStr(np.employee_rate)}%` },
    { label: "건강보험(각)", value: empHealth, unit: "원", formula: `보수 × ${pctStr(si.health.employee_rate)}%` },
    { label: "장기요양(각)", value: empCare, unit: "원", formula: `건강보험료 × ${pctStr(si.long_term_care.rate_of_health)}%` },
    { label: "고용보험 근로자", value: empUnemp, unit: "원", formula: `보수 × ${pctStr(si.employment.unemployment_employee)}%` },
    { label: "고용보험 사업주", value: erUnemp, unit: "원", formula: `보수 × (실업급여 ${pctStr(si.employment.unemployment_employer)}% + 고용안정·직업능력 ${pctStr(stabilityRate)}%)` },
    { label: "산재보험 사업주", value: erIndustrial, unit: "원", formula: `보수 × ${pctStr(input.industrialRate)}%` },
    { label: "근로자 공제 합계", value: employee.total, unit: "원" },
    { label: "사업주 부담 합계", value: employer.total, unit: "원" },
    { label: "월 총 인건비", value: monthlyTotalCost, unit: "원", formula: "기본급(비과세 포함) + 사업주 부담" },
  ];

  return {
    taxableBase, pensionBase, employee, employer, monthlyTotalCost,
    annualTotalCost: monthlyTotalCost * 12,
    annualSeveranceReserve,
    steps,
    notCovered: [
      "산재보험 개별실적요율(사업장 재해율에 따른 ±할인·할증)과 출퇴근재해 요율 분리",
      "두루누리 사회보험료 지원(10인 미만 사업장, 월 보수 기준액 미만 근로자)",
      "65세 이후 신규 고용자의 고용보험 제외, 일용직·단시간 근로자 특례",
      "근로소득세·지방소득세 원천징수(간이세액표). 이 도구는 4대보험만 다룹니다",
      "퇴직급여 적립액은 연 기본급 상당(1/12 적립)의 단순 추정이며 DC형 부담금과 다를 수 있습니다",
    ],
  };
}
