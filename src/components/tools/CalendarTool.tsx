"use client";
import cal from "@/rates/calendar-2026.json";
import { buildCalendar, toICS, type VatType } from "@/engine/calendar";
import { Actions, Badges, CheckField, Plain, SelectField, useShared } from "@/lib/ui";

type S = { entity: "individual" | "corporate"; vat: VatType; faithful: boolean; half: boolean; fiscal: number };

export default function CalendarTool() {
  const [s, set, link] = useShared<S>({ entity: "individual", vat: "general", faithful: false, half: false, fiscal: 12 });
  const events = buildCalendar({ entity: s.entity, vat: s.vat, faithful: s.faithful, withholdingHalf: s.half, fiscalMonth: s.fiscal });
  const thisMonth = new Date().getMonth() + 1;
  const byMonth = Array.from({ length: 12 }, (_, i) => events.filter((e) => Number(e.date.slice(5, 7)) === i + 1));
  const download = () => {
    const blob = new Blob([toICS(events)], { type: "text/calendar" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `tax-calendar-${cal.year}.ics`; a.click();
  };
  return (
    <>
      <h1>세무 캘린더 {cal.year}</h1>
      <p className="lead">가산세는 몰라서가 아니라 깜빡해서 생깁니다. 내 조건에 맞는 일정만 남기고, 휴대폰 캘린더에 넣어 두세요.</p>
      <Badges level="기초" />
      <Plain>사업자가 챙길 신고는 크게 넷입니다. 부가가치세(1·7월, 법인은 4·10월도), 소득세 또는 법인세(5월 또는 3월), 원천세(매달 10일), 4대보험(매달 10일). 기한이 주말이면 다음 평일까지입니다.</Plain>

      <div className="card">
        <div className="grid">
          <SelectField label="사업자 유형" value={s.entity} onChange={(v) => set({ ...s, entity: v })} options={[{ value: "individual", label: "개인사업자" }, { value: "corporate", label: "법인" }]} />
          <SelectField label="부가가치세 과세유형" value={s.vat} onChange={(v) => set({ ...s, vat: v })} options={[{ value: "general", label: "일반과세" }, { value: "simplified", label: "간이과세(개인만)" }, { value: "exempt", label: "면세" }]} />
          {s.entity === "corporate" && <SelectField label="결산월" value={s.fiscal} onChange={(v) => set({ ...s, fiscal: v })} options={[{ value: 12, label: "12월" }, { value: 3, label: "3월(일정 미지원)" }, { value: 6, label: "6월(일정 미지원)" }]} hint="12월 결산 외는 법인세 일정이 표시되지 않습니다" />}
        </div>
        <CheckField label="성실신고확인 대상" checked={s.faithful} onChange={(v) => set({ ...s, faithful: v })} hint="신고기한이 한 달 늦춰집니다" />
        <CheckField label="원천세 반기별 납부 승인 사업자" checked={s.half} onChange={(v) => set({ ...s, half: v })} hint="상시 20인 이하, 승인받은 경우" />
      </div>

      <div className="actions noprint">
        <button className="primary" onClick={download}>캘린더 파일(ICS) 내려받기</button>
      </div>

      {byMonth.map((list, i) => list.length ? (
        <div className="card" key={i} style={i + 1 === thisMonth ? { borderColor: "var(--accent)" } : undefined}>
          <h3>{i + 1}월{i + 1 === thisMonth ? " · 이번 달" : ""}</h3>
          <table>
            <tbody>
              {list.map((e, k) => (
                <tr key={k}>
                  <td className="num">{e.date.slice(5).replace("-", "/")}{e.shifted ? <span className="f"> (순연)</span> : null}</td>
                  <td>{e.title}{e.note ? <div className="f">{e.note}</div> : null}</td>
                  <td className="f">{e.basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null)}

      <Actions link={link} />
      <p className="muted">{cal.source} 지방세(재산세·자동차세 등)와 수입 통관 일정은 포함하지 않습니다.</p>
    </>
  );
}
