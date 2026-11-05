import type { Metadata } from "next";
import Link from "next/link";
import "./pretendard.css";
import "./globals.css";
import rates from "@/rates/2026.json";

export const metadata: Metadata = {
  title: { default: "경영 도구함", template: "%s | 경영 도구함" },
  description: "창업기업·중소기업·소상공인을 위한 세무·노무 계산기와 체크리스트. 산식과 법령 근거를 전부 공개하고, 입력값은 서버로 보내지 않습니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="site">
          <div className="in">
            <Link href="/" className="brand">경영 도구함</Link>
            <nav>
              <Link href="/tools/payroll-cost/">인건비</Link>
              <Link href="/tools/severance/">퇴직금</Link>
              <Link href="/tools/income-tax/">종합소득세</Link>
              <Link href="/tools/incorporation/">법인전환</Link>
              <Link href="/tools/tax-calendar/">세무 캘린더</Link>
              <Link href="/checklists/">체크리스트</Link>
              <Link href="/rates/">세율표</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site">
          <div className="in">
            <p>본 사이트는 경영자문 참고용 계산·정보를 제공합니다. 세무대리·노무대리·법률사무는 각 자격사의 업무이며, 개별 신고·판단은 세무사·공인노무사·변호사와 확인하십시오. 입력값은 서버로 전송되지 않고 브라우저 안에서만 계산됩니다.</p>
            <p>적용 세율 {rates.year}년 · 기준일 {rates.effective_from} · 최종 검토 {rates.last_reviewed} · <Link href="/changelog/">변경 이력</Link> · <Link href="/about/">고지·제보</Link></p>
          </div>
        </footer>
      </body>
    </html>
  );
}
