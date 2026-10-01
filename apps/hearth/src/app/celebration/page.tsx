import { redirect } from "next/navigation";
import { getSessionMember } from "@/lib/session";
import { MILESTONE_NAMES } from "@/lib/repo";
import { CelebrationView } from "@/components/celebration-view";

export const dynamic = "force-dynamic";

export default async function CelebrationPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; m?: string }>;
}) {
  const member = await getSessionMember();
  if (!member) redirect("/onboarding");
  const { s, m } = await searchParams;
  const streak = Number(s ?? "0");
  const milestone = m ? (MILESTONE_NAMES[Number(m)] ?? null) : null;

  return <CelebrationView streak={streak} milestoneName={milestone} />;
}
