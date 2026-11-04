import type { Metadata } from "next";
import Link from "next/link";
import { checklists } from "@/content/checklists";

export const metadata: Metadata = { title: "체크리스트" };

export default function Page() {
  return (
    <>
      <h1>체크리스트</h1>
      <p className="lead">각 항목에 누가 하는 일인지 표시했습니다. 체크 상태는 이 브라우저에만 저장됩니다.</p>
      <div className="toollist grid">
        {checklists.map((c) => (
          <Link href={`/checklists/${c.slug}/`} className="tool" key={c.slug}>
            <div className="card"><span className="badge level">{c.level}</span><h3>{c.title}</h3><p className="muted">{c.items.length}개 항목</p></div>
          </Link>
        ))}
      </div>
    </>
  );
}
