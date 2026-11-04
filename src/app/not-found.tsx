import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <h1>페이지를 찾을 수 없습니다</h1>
      <p className="lead">주소가 바뀌었거나 잘못 입력된 것 같습니다.</p>
      <ul>
        <li><Link href="/">홈으로</Link></li>
        <li><Link href="/tools/payroll-cost/">인건비 총액 계산기</Link></li>
        <li><Link href="/tools/tax-calendar/">세무 캘린더</Link></li>
      </ul>
    </>
  );
}
