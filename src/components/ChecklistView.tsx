"use client";
import { useEffect, useState } from "react";
import type { Checklist } from "@/content/checklists";

export default function ChecklistView({ list }: { list: Checklist }) {
  const key = `checklist:${list.slug}`;
  const [done, setDone] = useState<boolean[]>(() => list.items.map(() => false));
  useEffect(() => { try { const v = localStorage.getItem(key); if (v) setDone(JSON.parse(v)); } catch {} }, [key]);
  const toggle = (i: number) => { const n = done.slice(); n[i] = !n[i]; setDone(n); try { localStorage.setItem(key, JSON.stringify(n)); } catch {} };
  const count = done.filter(Boolean).length;
  return (
    <>
      <h1>{list.title}</h1>
      <div className="badges"><span className="badge level">{list.level}</span><span className="badge">{count}/{list.items.length} 완료</span></div>
      <p className="lead">{list.intro}</p>
      <ul className="checklist card">
        {list.items.map((it, i) => (
          <li key={i}>
            <input type="checkbox" checked={!!done[i]} onChange={() => toggle(i)} id={`c${i}`} />
            <label htmlFor={`c${i}`} style={{ flex: 1 }}>
              {it.text}
              {it.basis && <div className="f muted">{it.basis}</div>}
            </label>
            <span className="who">{it.who}</span>
          </li>
        ))}
      </ul>
      <div className="actions noprint"><button onClick={() => window.print()}>인쇄 / PDF</button><button onClick={() => { setDone(list.items.map(() => false)); try { localStorage.removeItem(key); } catch {} }}>초기화</button></div>
      <p className="muted">"세무사·노무사·법무사"로 표시된 항목은 해당 자격사의 업무입니다. 이 사이트는 준비와 이해를 돕는 용도이며 대리하지 않습니다.</p>
    </>
  );
}
