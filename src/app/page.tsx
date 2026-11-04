import Link from "next/link";

const tools = [
  { href: "/tools/payroll-cost/", level: "기초", title: "인건비 총액 계산기", desc: "직원 한 명 뽑으면 월급 외에 회사가 실제로 얼마를 더 내는지. 4대보험 사업주 부담과 근로자 공제." },
  { href: "/tools/severance/", level: "기초", title: "퇴직금 계산기", desc: "입사일·퇴사일·최근 3개월 임금으로 법정 퇴직금. 통상임금 비교까지." },
  { href: "/tools/tax-calendar/", level: "기초", title: "세무 캘린더", desc: "개인·법인, 과세유형, 성실신고 여부에 맞는 올해 신고·납부 일정. 캘린더 파일로 내려받기." },
  { href: "/tools/income-tax/", level: "실무", title: "종합소득세 계산기", desc: "기장 기준 세액과 구간별 세금, 노란우산·연금계좌 절세 효과. 추계·성실신고·복식부기 요건 판정." },
  { href: "/tools/incorporation/", level: "심화", title: "법인전환 손익분기", desc: "급여와 배당으로 돈을 꺼내는 것까지 반영한 개인 vs 법인 총부담 비교. 유보이익은 내 돈이 아니라는 전제로." },
];

const paths = [
  { title: "창업을 준비 중입니다", items: [["세무 캘린더로 첫해 일정 보기", "/tools/tax-calendar/"], ["법인으로 시작할지 개인으로 시작할지", "/tools/incorporation/"], ["법인전환·설립 준비자료 체크리스트", "/checklists/incorporation/"]] },
  { title: "직원이 생겼습니다", items: [["인건비 총액부터 계산", "/tools/payroll-cost/"], ["채용 서류 체크리스트", "/checklists/hiring/"], ["퇴사 처리 순서", "/checklists/offboarding/"]] },
  { title: "세금이 커지고 있습니다", items: [["올해 종합소득세 미리 보기", "/tools/income-tax/"], ["법인전환이 실제로 이득인지", "/tools/incorporation/"], ["적용 중인 세율·요율 전부 보기", "/rates/"]] },
];

export default function Home() {
  return (
    <>
      <h1>창업기업·중소기업·소상공인을 위한 계산기와 체크리스트</h1>
      <p className="lead">모든 결과에 산식, 중간값, 법령 조문을 같이 보여줍니다. 입력값은 서버로 가지 않습니다. 틀린 숫자를 보셨다면 <Link href="/about/">제보</Link>해 주세요.</p>

      <h2>지금 어떤 상황인가요?</h2>
      <div className="path">
        {paths.map((p) => (
          <div className="card" key={p.title}>
            <strong>{p.title}</strong>
            <ul>{p.items.map(([t, h]) => <li key={h}><Link href={h}>{t}</Link></li>)}</ul>
          </div>
        ))}
      </div>

      <h2>도구</h2>
      <div className="toollist grid">
        {tools.map((t) => (
          <Link href={t.href} className="tool" key={t.href}>
            <div className="card">
              <span className="badge level">{t.level}</span>
              <h3>{t.title}</h3>
              <p className="muted">{t.desc}</p>
            </div>
          </Link>
        ))}
      </div>
      <p className="muted">기초: 숫자 하나로 바로 답이 나오는 것. 실무: 매년 반복되는 신고를 미리 보는 것. 심화: 구조를 바꾸는 결정을 돕는 것.</p>
    </>
  );
}
