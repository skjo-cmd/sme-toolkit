import { Step, won } from "./types";

export interface SeveranceInput {
  hireDate: string; // YYYY-MM-DD
  leaveDate: string; // 퇴직일(마지막 근무일 다음날)
  /** 퇴직 전 3개월 임금. 3칸 입력이면 합계, 평균 1칸이면 ×3 */
  lastThreeMonthsWages: number;
  annualBonus: number;
  annualLeavePay: number;
  /** 선택: 1일 통상임금. 평균임금이 이보다 낮으면 통상임금 적용 */
  ordinaryDailyWage?: number;
}

export interface SeveranceResult {
  serviceDays: number;
  serviceYears: number;
  eligible: boolean;
  periodStart: string;
  periodDays: number;
  wageBase: number;
  averageDailyWage: number;
  appliedDailyWage: number;
  usedOrdinaryWage: boolean;
  severance: number;
  steps: Step[];
  notCovered: string[];
}

const DAY = 86400000;
const parse = (s: string) => new Date(s + "T00:00:00Z");
const fmt = (d: Date) => d.toISOString().slice(0, 10);

export function calcSeverance(input: SeveranceInput): SeveranceResult {
  const hire = parse(input.hireDate);
  const leave = parse(input.leaveDate);
  const serviceDays = Math.round((leave.getTime() - hire.getTime()) / DAY);
  const serviceYears = serviceDays / 365;
  const eligible = serviceDays >= 365;

  // 퇴직일 이전 3개월: [퇴직일 − 3개월, 퇴직일)
  const start = new Date(leave);
  start.setUTCMonth(start.getUTCMonth() - 3);
  const periodDays = Math.round((leave.getTime() - start.getTime()) / DAY);

  const wageBase = input.lastThreeMonthsWages + input.annualBonus * 3 / 12 + input.annualLeavePay * 3 / 12;
  const averageDailyWage = periodDays > 0 ? wageBase / periodDays : 0;
  const usedOrdinaryWage = !!input.ordinaryDailyWage && input.ordinaryDailyWage > averageDailyWage;
  const appliedDailyWage = usedOrdinaryWage ? (input.ordinaryDailyWage as number) : averageDailyWage;
  const severance = eligible ? won(appliedDailyWage * 30 * serviceDays / 365) : 0;

  const steps: Step[] = [
    { label: "재직일수", value: serviceDays, unit: "일", formula: `${input.leaveDate} − ${input.hireDate}` },
    { label: "평균임금 산정 기간(퇴직 전 3개월) 총일수", value: periodDays, unit: "일", formula: `${fmt(start)} ~ ${input.leaveDate} 전일` },
    { label: "3개월 임금 총액(상여·연차수당 3/12 포함)", value: won(wageBase), unit: "원", formula: "3개월 임금 + 연 상여 × 3/12 + 연차수당 × 3/12" },
    { label: "1일 평균임금", value: Math.round(averageDailyWage * 100) / 100, unit: "원", formula: "임금 총액 ÷ 총일수" },
    { label: "적용 1일 임금", value: Math.round(appliedDailyWage * 100) / 100, unit: "원", note: usedOrdinaryWage ? "평균임금이 통상임금보다 낮아 통상임금 적용(근로기준법 제2조 제2항)" : "평균임금 적용" },
    { label: "퇴직금", value: severance, unit: "원", formula: "1일 임금 × 30 × 재직일수 ÷ 365", note: eligible ? undefined : "계속근로 1년 미만은 지급 의무 없음" },
  ];

  return {
    serviceDays, serviceYears, eligible, periodStart: fmt(start), periodDays, wageBase, averageDailyWage,
    appliedDailyWage, usedOrdinaryWage, severance, steps,
    notCovered: [
      "DC형 퇴직연금 가입 사업장의 부담금(연 임금총액의 1/12 이상) 계산",
      "중간정산 이력, 산정 제외 기간(휴업·육아휴직·업무상 재해 등, 근로기준법 시행령 제2조) 자동 반영",
      "퇴직소득세 원천징수액과 실수령액",
      "주 15시간 미만 초단시간 근로자 제외 판정",
    ],
  };
}
