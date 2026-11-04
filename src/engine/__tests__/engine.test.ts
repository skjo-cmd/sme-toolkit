import { describe, it, expect } from "vitest";
import rates from "../../rates/2026.json";
import { calcPayroll } from "../payroll";
import { calcSeverance } from "../severance";
import { calcIncomeTax, judgeThresholds } from "../incomeTax";
import { calcSalaryTax, earnedIncomeDeduction } from "../salary";
import { calcIncorporation } from "../incorporation";
import { progressiveTax } from "../types";

describe("progressiveTax", () => {
  it("소득세 과표 1.8억 → 4,846만(국세)", () => {
    expect(progressiveTax(180_000_000, rates.income_tax.brackets).tax).toBe(48_460_000);
  });
  it("법인세 2026: 1.8억 → 1,800만, 4.5억 → 7,000만", () => {
    expect(progressiveTax(180_000_000, rates.corp_tax.brackets).tax).toBe(18_000_000);
    expect(progressiveTax(450_000_000, rates.corp_tax.brackets).tax).toBe(70_000_000);
  });
});

describe("payroll (골든: 노무원큐 실측 2026-11-04, 10원 절사 차이 7원)", () => {
  const r = calcPayroll({ basePay: 3_000_000, mealAllowance: 200_000, vehicleAllowance: 0, otherNonTaxable: 0, employerTier: "under150", industrialRate: 0.0147 }, rates);
  it("보수 기준 280만", () => expect(r.taxableBase).toBe(2_800_000));
  it("국민연금 133,000 / 건보 100,660 / 고용 근로자 25,200 / 사업주 32,200 / 산재 41,160", () => {
    expect(r.employee.pension).toBe(133_000);
    expect(r.employee.health).toBe(100_660);
    expect(r.employee.unemployment).toBe(25_200);
    expect(r.employer.unemployment).toBe(32_200);
    expect(r.employer.industrial).toBe(41_160);
  });
  it("장기요양 10원 절사 13,220 (노무원큐 반올림 13,227)", () => expect(r.employee.care).toBe(13_220));
  it("합계: 근로자 272,080 / 사업주 320,240", () => {
    expect(r.employee.total).toBe(272_080);
    expect(r.employer.total).toBe(320_240);
  });
  it("국민연금 상한 적용: 보수 1,000만 → 기준소득월액 637만", () => {
    const h = calcPayroll({ basePay: 10_000_000, mealAllowance: 0, vehicleAllowance: 0, otherNonTaxable: 0, employerTier: "under150", industrialRate: 0.0147 }, rates);
    expect(h.pensionBase).toBe(6_370_000);
    expect(h.employee.pension).toBe(302_570);
  });
});

describe("severance (골든: 노무원큐 실측)", () => {
  it("2023-01-01~2026-01-01, 월 300만 → 8,812,388", () => {
    const r = calcSeverance({ hireDate: "2023-01-01", leaveDate: "2026-01-01", lastThreeMonthsWages: 9_000_000, annualBonus: 0, annualLeavePay: 0 });
    expect(r.serviceDays).toBe(1096);
    expect(r.periodDays).toBe(92);
    expect(r.severance).toBe(8_812_388);
  });
  it("1년 미만은 0", () => {
    expect(calcSeverance({ hireDate: "2025-03-01", leaveDate: "2026-01-01", lastThreeMonthsWages: 9_000_000, annualBonus: 0, annualLeavePay: 0 }).severance).toBe(0);
  });
  it("통상임금이 더 높으면 통상임금 적용", () => {
    const r = calcSeverance({ hireDate: "2023-01-01", leaveDate: "2026-01-01", lastThreeMonthsWages: 9_000_000, annualBonus: 0, annualLeavePay: 0, ordinaryDailyWage: 120_000 });
    expect(r.usedOrdinaryWage).toBe(true);
    expect(r.severance).toBe(Math.round(120_000 * 30 * 1096 / 365));
  });
});

describe("incomeTax (골든: 세금뚝딱 실측 + 손계산)", () => {
  it("과표 49,620,000 → 산출 6,183,000", () => {
    const r = calcIncomeTax({ businessIncome: 51_120_000, dependents: 1, yellowUmbrella: 0, pensionSavings: 0, irp: 0, otherIncomeDeductions: 0, otherTaxCredits: 0, prepaidTax: 0, eFiling: true, hasItemizedCredits: true }, rates);
    expect(r.taxableBase).toBe(49_620_000);
    expect(r.computedTax).toBe(6_183_000);
    expect(r.determinedTax).toBe(6_163_000);
    expect(r.localTax).toBe(616_300);
  });
  it("과표 1억 절세 세트(노란우산 500→한도 400, 연금 600, IRP 300) → 절세 272.8만", () => {
    const base = { dependents: 1, otherIncomeDeductions: 0, otherTaxCredits: 0, prepaidTax: 0, eFiling: false, hasItemizedCredits: true };
    const before = calcIncomeTax({ ...base, businessIncome: 100_000_000, yellowUmbrella: 0, pensionSavings: 0, irp: 0 }, rates);
    const after = calcIncomeTax({ ...base, businessIncome: 100_000_000, yellowUmbrella: 5_000_000, pensionSavings: 6_000_000, irp: 3_000_000 }, rates);
    expect(before.taxableBase).toBe(98_500_000);
    expect(after.yellowUmbrellaLimit).toBe(4_000_000);
    expect(after.yellowUmbrellaApplied).toBe(4_000_000);
    expect(after.pensionCredit).toBe(1_080_000);
    expect(before.totalTax - after.totalTax).toBe(2_728_000);
  });
  it("요건 판정: 전문서비스 매출 1.2억은 단순경비율 불가, 성실신고 미달", () => {
    const j = judgeThresholds(2, 120_000_000, 120_000_000, rates);
    expect(j.simplifiedRateEligible).toBe(false);
    expect(j.faithfulFiling).toBe(false);
    expect(j.doubleEntryRequired).toBe(true);
  });
});

describe("salary tax", () => {
  it("근로소득공제 6,000만 → 1,275만, 1억 → 1,475만", () => {
    expect(earnedIncomeDeduction(60_000_000, rates)).toBe(12_750_000);
    expect(earnedIncomeDeduction(100_000_000, rates)).toBe(14_750_000);
  });
  it("급여 6,000만 산출세액 5,602,500 (corp-convert 실측과 동일), 세액공제 후 결정세액 더 낮음", () => {
    const r = calcSalaryTax(60_000_000, 1, rates);
    expect(r.computedTax).toBe(5_602_500);
    expect(r.credit).toBe(660_000);
    expect(r.determinedTax).toBe(5_602_500 - 660_000 - 130_000);
  });
});

describe("incorporation", () => {
  const base = { netProfit: 180_000_000, dependents: 1, maintenanceCost: 3_600_000, includeSocialInsurance: false };
  it("급여 0·배당 0: 개인 5,267.9만 vs 법인세 1,940.4만(유지비 손금)", () => {
    const r = calcIncorporation({ ...base, ceoSalary: 0, dividendRatio: 0 }, rates);
    expect(r.individual.tax).toBe(52_602_000);
    expect(r.corporate.corpTax).toBe(17_640_000);
    expect(r.corporate.tax).toBe(19_404_000);
    expect(r.retainedWarning).toBe(true);
  });
  it("급여 6,000만·배당 0: 법인세 1,280.4만 + 급여세 약 529만", () => {
    const r = calcIncorporation({ ...base, ceoSalary: 60_000_000, dividendRatio: 0 }, rates);
    expect(r.corporate.corpTax).toBe(11_640_000);
    expect(r.corporate.salaryTax).toBe((5_602_500 - 660_000 - 130_000) + Math.round((5_602_500 - 660_000 - 130_000) * 0.1));
  });
  it("급여 0·배당 100%: 세금 기준 이점이 거의 사라지고(±500만 이내), 건보 포함 시 개인이 유리", () => {
    const r = calcIncorporation({ ...base, ceoSalary: 0, dividendRatio: 1 }, rates);
    expect(r.corporate.dividend).toBe(r.corporate.afterTaxProfit);
    expect(Math.abs(r.diffTaxOnly)).toBeLessThan(5_000_000);
    const withSI = calcIncorporation({ ...base, includeSocialInsurance: true, ceoSalary: 0, dividendRatio: 1 }, rates);
    expect(withSI.individual.socialInsurance).toBeGreaterThan(0);
    expect(withSI.corporate.socialInsurance).toBeGreaterThan(0);
  });
  it("배당 2,000만 이하는 분리과세 15.4%", () => {
    const r = calcIncorporation({ netProfit: 60_000_000, ceoSalary: 40_000_000, dividendRatio: 1, dependents: 1, maintenanceCost: 0, includeSocialInsurance: false }, rates);
    expect(r.corporate.dividend).toBeLessThanOrEqual(20_000_000);
    expect(r.corporate.dividendTax).toBe(Math.round(r.corporate.dividend * 0.154));
  });
});
