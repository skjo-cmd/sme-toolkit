"use client";
import { useEffect, useState, type ReactNode } from "react";
import rates from "@/rates/2026.json";
import type { Step } from "@/engine/types";

export const fmt = (n: number) => Math.round(n).toLocaleString("ko-KR");
export const fmtMan = (n: number) => {
  const man = Math.round(n / 10000);
  if (Math.abs(man) >= 10000) return `${(man / 10000).toFixed(2).replace(/\.?0+$/, "")}억 원`;
  return `${man.toLocaleString("ko-KR")}만 원`;
};

/** 입력값을 URL 해시로 공유. 서버 저장 없음. */
export function useShared<T>(initial: T): [T, (v: T) => void, () => string] {
  const [state, setState] = useState<T>(initial);
  useEffect(() => {
    try {
      const m = window.location.hash.match(/i=([A-Za-z0-9_-]+)/);
      if (m) {
        const json = decodeURIComponent(escape(atob(m[1].replace(/-/g, "+").replace(/_/g, "/"))));
        setState({ ...initial, ...JSON.parse(json) });
      }
    } catch { /* 잘못된 링크는 무시 */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const link = () => {
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(state)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const url = `${window.location.origin}${window.location.pathname}#i=${b64}`;
    return url;
  };
  return [state, setState, link];
}

export function NumberField({ label, value, onChange, hint, suffix = "원", step }: { label: string; value: number; onChange: (n: number) => void; hint?: string; suffix?: string; step?: number }) {
  const [text, setText] = useState(value ? fmt(value) : "");
  useEffect(() => { setText(value ? fmt(value) : ""); }, [value]);
  return (
    <div className="field">
      <label>{label}{suffix ? ` (${suffix})` : ""}</label>
      <input inputMode="numeric" value={text} step={step}
        onChange={(e) => { const raw = e.target.value.replace(/[^\d]/g, ""); setText(raw ? Number(raw).toLocaleString("ko-KR") : ""); onChange(raw ? Number(raw) : 0); }} />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function SelectField<T extends string | number>({ label, value, onChange, options, hint }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; hint?: string }) {
  return (
    <div className="field">
      <label>{label}</label>
      <select value={String(value)} onChange={(e) => { const o = options.find((x) => String(x.value) === e.target.value); if (o) onChange(o.value); }}>
        {options.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
      </select>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function CheckField({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="field check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} id={label} />
      <label htmlFor={label}>{label}{hint && <span className="hint"> · {hint}</span>}</label>
    </div>
  );
}

export function Badges({ level, extra }: { level: "기초" | "실무" | "심화"; extra?: ReactNode }) {
  return (
    <div className="badges">
      <span className="badge level">{level}</span>
      <span className="badge">적용 세율 {rates.year}년</span>
      <span className="badge">기준일 {rates.effective_from}</span>
      <span className={`badge ${rates.status === "confirmed" ? "" : "proposed"}`}>{rates.status === "confirmed" ? "확정 법령" : "정부안 포함"}</span>
      {extra}
    </div>
  );
}

export function Plain({ children }: { children: ReactNode }) {
  return <div className="plain"><strong>쉽게 말하면</strong><br />{children}</div>;
}

export function Steps({ steps, title = "계산 과정" }: { steps: Step[]; title?: string }) {
  return (
    <details>
      <summary>{title} (중간값 전부)</summary>
      <table>
        <thead><tr><th>항목</th><th className="num">값</th><th>산식·비고</th></tr></thead>
        <tbody>
          {steps.map((s, i) => (
            <tr key={i}>
              <td>{s.label}</td>
              <td className="num">{typeof s.value === "number" ? (s.unit === "일" || s.unit === "년" ? s.value.toLocaleString("ko-KR") : fmt(s.value)) : s.value}{s.unit ? ` ${s.unit}` : ""}</td>
              <td className="f">{s.formula}{s.formula && s.note ? " · " : ""}{s.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

export function NotCovered({ items }: { items: string[] }) {
  return (
    <div className="card notcovered">
      <strong>이 계산기가 다루지 않는 것</strong>
      <ul>{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
  );
}

export function Actions({ link }: { link: () => string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="actions noprint">
      <button className="primary" onClick={async () => { const u = link(); try { await navigator.clipboard.writeText(u); } catch { window.prompt("링크를 복사하세요", u); } setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
        {copied ? "복사됨" : "입력값 포함 링크 복사"}
      </button>
      <button onClick={() => window.print()}>인쇄 / PDF</button>
    </div>
  );
}

export function Basis({ items }: { items: string[] }) {
  return <p className="muted">근거: {items.join(" · ")}</p>;
}
