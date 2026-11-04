import type { Metadata } from "next";
import IncorporationTool from "@/components/tools/IncorporationTool";

export const metadata: Metadata = { title: "법인전환 손익분기", description: "급여와 배당으로 돈을 꺼내는 것까지 반영한 개인사업자 vs 법인 총부담 비교. 유보이익은 대표 소득이 아니라는 전제로 계산합니다." };

export default function Page() { return <IncorporationTool />; }
