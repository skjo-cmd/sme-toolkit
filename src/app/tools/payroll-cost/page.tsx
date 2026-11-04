import type { Metadata } from "next";
import PayrollTool from "@/components/tools/PayrollTool";

export const metadata: Metadata = { title: "인건비 총액 계산기", description: "기본급과 비과세를 넣으면 4대보험 근로자 공제와 사업주 부담, 월·연 총 인건비를 2026년 요율로 계산합니다." };

export default function Page() { return <PayrollTool />; }
