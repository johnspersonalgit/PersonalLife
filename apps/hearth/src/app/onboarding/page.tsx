import { redirect } from "next/navigation";
import { getSessionMember } from "@/lib/session";
import { OnboardingFlow } from "@/components/onboarding-flow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const member = await getSessionMember();
  if (member) redirect("/");
  return <OnboardingFlow />;
}
