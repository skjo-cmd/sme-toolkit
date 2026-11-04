import type { Metadata } from "next";
import { checklists } from "@/content/checklists";
import ChecklistView from "@/components/ChecklistView";

export function generateStaticParams() { return checklists.map((c) => ({ slug: c.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = checklists.find((x) => x.slug === slug);
  return { title: c?.title ?? "체크리스트" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = checklists.find((x) => x.slug === slug);
  if (!c) return <p>없는 체크리스트입니다.</p>;
  return <ChecklistView list={c} />;
}
