import cal from "../rates/calendar-2026.json";

export type Calendar = typeof cal;
export type VatType = "general" | "simplified" | "exempt";

export interface CalendarInput {
  entity: "individual" | "corporate";
  vat: VatType;
  faithful: boolean;
  withholdingHalf: boolean;
  fiscalMonth: number;
}

export interface CalendarEvent { date: string; originalDate: string; shifted: boolean; title: string; basis: string; note?: string; who: string }

const pad = (n: number) => String(n).padStart(2, "0");

function shiftToBusinessDay(y: number, m: number, d: number, holidays: string[]) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  // 말일 초과 보정(2월 30일 등은 없음)
  let shifted = false;
  for (let i = 0; i < 10; i++) {
    const iso = dt.toISOString().slice(0, 10);
    const dow = dt.getUTCDay();
    if (dow !== 0 && dow !== 6 && !holidays.includes(iso)) return { iso, shifted };
    dt.setUTCDate(dt.getUTCDate() + 1);
    shifted = true;
  }
  return { iso: dt.toISOString().slice(0, 10), shifted };
}

type Cond = { vat?: string[]; faithful?: boolean; withholdingHalf?: boolean; fiscalMonth?: number };

function matches(whoList: string[], cond: Cond | undefined, input: CalendarInput) {
  const who = whoList.includes("common") || whoList.includes(input.entity);
  if (!who) return false;
  if (!cond) return true;
  if (cond.vat && !cond.vat.includes(input.vat)) return false;
  if (cond.faithful !== undefined && cond.faithful !== input.faithful) return false;
  if (cond.withholdingHalf !== undefined && cond.withholdingHalf !== input.withholdingHalf) return false;
  if (cond.fiscalMonth !== undefined && cond.fiscalMonth !== input.fiscalMonth) return false;
  return true;
}

export function buildCalendar(input: CalendarInput, data: Calendar = cal): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  for (const it of data.items) {
    if (!matches(it.who, it.cond as Cond | undefined, input)) continue;
    const s = shiftToBusinessDay(data.year, it.month, it.day, data.holidays);
    out.push({ date: s.iso, originalDate: `${data.year}-${pad(it.month)}-${pad(it.day)}`, shifted: s.shifted, title: it.title, basis: it.basis, note: (it as { note?: string }).note, who: it.who.join(",") });
  }
  for (let m = 1; m <= 12; m++) {
    for (const it of data.monthly) {
      if (!matches(it.who, it.cond as Cond | undefined, input)) continue;
      const s = shiftToBusinessDay(data.year, m, it.day, data.holidays);
      out.push({ date: s.iso, originalDate: `${data.year}-${pad(m)}-${pad(it.day)}`, shifted: s.shifted, title: it.title, basis: it.basis, who: it.who.join(",") });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function toICS(events: CalendarEvent[], name = "세무 캘린더") {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//sme-toolkit//${name}//KO`, "CALSCALE:GREGORIAN"];
  for (const e of events) {
    const d = e.date.replace(/-/g, "");
    lines.push("BEGIN:VEVENT", `UID:${d}-${e.title.replace(/\W/g, "").slice(0, 30)}@sme-toolkit`, `DTSTART;VALUE=DATE:${d}`, `SUMMARY:${e.title}`, `DESCRIPTION:${e.basis}${e.note ? " / " + e.note : ""}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
