import { redirect } from "next/navigation";
import { ComboView } from "@/components/combo-view";
import { getSessionMember } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ComboPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; d?: string }>;
}) {
  const member = await getSessionMember();
  if (!member) redirect("/onboarding");
  const { c, d } = await searchParams;
  const combo = Math.max(1, Number(c ?? "1") || 1);
  const depth = Math.max(0, Number(d ?? "0") || 0);

  return <ComboView combo={combo} depth={depth} />;
}
