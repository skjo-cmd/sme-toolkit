import rates2026 from "../rates/2026.json";

export type Rates = typeof rates2026;

export interface Step {
  label: string;
  value: number;
  unit?: "원" | "일" | "%" | "년";
  formula?: string;
  note?: string;
}

export interface Bracket {
  upTo: number | null;
  rate: number;
  deduction?: number;
}

export const won = (n: number) => Math.round(n);
/** 비율을 퍼센트 문자열로. 부동소수점 꼬리 제거 (0.009 → "0.9") */
export const pctStr = (r: number) => String(Number((r * 100).toFixed(4)));
/** 공단 고지 기준: 10원 미만 절사 */
export const floor10 = (n: number) => Math.floor(Math.round(n) / 10) * 10;

/** 누진세율표로 산출세액 계산. 구간별 세액도 함께 돌려준다. */
export function progressiveTax(base: number, brackets: Bracket[]) {
  const taxable = Math.max(0, Math.floor(base));
  let prev = 0;
  let total = 0;
  const perBracket: { rate: number; amount: number; tax: number }[] = [];
  for (const b of brackets) {
    const upper = b.upTo ?? Infinity;
    if (taxable <= prev) break;
    const amount = Math.min(taxable, upper) - prev;
    const tax = amount * b.rate;
    perBracket.push({ rate: b.rate, amount, tax });
    total += tax;
    prev = upper;
  }
  return { tax: won(total), perBracket };
}

export function marginalBracket(base: number, brackets: Bracket[]) {
  for (const b of brackets) if (b.upTo === null || base <= b.upTo) return b;
  return brackets[brackets.length - 1];
}
