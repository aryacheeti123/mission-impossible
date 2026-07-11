import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { MissionReviewQueue } from "@/components/MissionReviewQueue";
import { getGroupDetail } from "@/lib/actions/groups";
import { getGroupMissionDashboard } from "@/lib/actions/missions";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function MissionReviewPage({ params }: PageProps) {
  const { groupId } = await params;
  const group = await getGroupDetail(groupId);

  if (!group || group.role !== "admin") {
    notFound();
  }

  const dashboard = await getGroupMissionDashboard(groupId);

  if (!dashboard) {
    notFound();
  }

  return (
    <AppShell>
      <section className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review missions</h1>
          <p className="mt-2 text-muted-foreground">{group.name}</p>
        </div>
        <MissionReviewQueue missions={dashboard.pendingMissions} />
      </section>
    </AppShell>
  );
}
