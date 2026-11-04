import type { Metadata } from "next";
import SeveranceTool from "@/components/tools/SeveranceTool";

export const metadata: Metadata = { title: "퇴직금 계산기", description: "입사일·퇴직일·퇴직 전 3개월 임금으로 법정 퇴직금을 계산합니다. 상여·연차수당 반영, 통상임금 비교." };

export default function Page() { return <SeveranceTool />; }
