import { describe, it, expect } from "vitest";
import { buildCalendar } from "../calendar";

describe("calendar 2026", () => {
  it("1/25(일) 부가세 확정신고는 1/26(월)로, 10/25(일)는 10/26(월)로 순연", () => {
    const ev = buildCalendar({ entity: "corporate", vat: "general", faithful: false, withholdingHalf: false, fiscalMonth: 12 });
    const jan = ev.find((e) => e.originalDate === "2026-01-25");
    const oct = ev.find((e) => e.originalDate === "2026-10-25");
    expect(jan?.date).toBe("2026-01-26");
    expect(oct?.date).toBe("2026-10-26");
  });
  it("5/31(일) 종소세는 6/1(월), 성실신고 대상은 6/30", () => {
    const a = buildCalendar({ entity: "individual", vat: "general", faithful: false, withholdingHalf: false, fiscalMonth: 12 });
    const b = buildCalendar({ entity: "individual", vat: "general", faithful: true, withholdingHalf: false, fiscalMonth: 12 });
    expect(a.find((e) => e.title.startsWith("종합소득세 확정"))?.date).toBe("2026-06-01");
    expect(a.find((e) => e.title.startsWith("종합소득세 신고 연장분"))).toBeUndefined();
    expect(b.find((e) => e.title.startsWith("종합소득세 신고 연장분"))?.date).toBe("2026-06-30");
  });
  it("반기납 사업자는 매월 원천세 대신 1월·7월 10일만", () => {
    const ev = buildCalendar({ entity: "individual", vat: "simplified", faithful: false, withholdingHalf: true, fiscalMonth: 12 });
    expect(ev.filter((e) => e.title.startsWith("원천세 신고·납부(전월")).length).toBe(0);
    expect(ev.filter((e) => e.title.startsWith("원천세 반기납부")).length).toBe(2);
  });
});
