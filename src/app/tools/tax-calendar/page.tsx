import type { Metadata } from "next";
import CalendarTool from "@/components/tools/CalendarTool";

export const metadata: Metadata = { title: "세무 캘린더 2026", description: "개인·법인, 과세유형, 성실신고 여부에 맞는 2026년 신고·납부 일정. 주말·공휴일 순연 반영, 캘린더 파일(ICS) 다운로드." };

export default function Page() { return <CalendarTool />; }
