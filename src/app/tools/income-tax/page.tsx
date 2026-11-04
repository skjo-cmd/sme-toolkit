import type { Metadata } from "next";
import IncomeTaxTool from "@/components/tools/IncomeTaxTool";

export const metadata: Metadata = { title: "종합소득세 계산기", description: "기장 기준 사업소득의 2026년 종합소득세를 구간별로 계산하고, 노란우산·연금계좌 절세 효과와 추계·성실신고·복식부기 요건을 판정합니다." };

export default function Page() { return <IncomeTaxTool />; }
