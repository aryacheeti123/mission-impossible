import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, Plus, Settings, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { GroupHeader } from "@/components/GroupHeader";
import { MissionOutingCard } from "@/components/MissionOutingCard";
import { MissionTemplateCard } from "@/components/MissionTemplateCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGroupDetail } from "@/lib/actions/groups";
import { getGroupMissionDashboard } from "@/lib/actions/missions";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupMissionsPage({ params }: PageProps) {
  const { groupId } = await params;
  const group = await getGroupDetail(groupId);

  if (!group) {
    notFound();
  }

  const dashboard = await getGroupMissionDashboard(groupId);

  if (!dashboard) {
    notFound();
  }

  return (
    <AppShell>
      <GroupHeader group={group} />
      <section className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Missions</h1>
            <p className="mt-2 text-muted-foreground">
              Group-specific challenges for a night out.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/groups/${group.id}/missions/preferences`}>
                <Settings className="h-4 w-4" />
                Preferences
              </Link>
            </Button>
            {dashboard.canAdmin ? (
              <>
                <Button asChild variant="outline">
                  <Link href={`/groups/${group.id}/missions/generate`}>
                    <Sparkles className="h-4 w-4" />
                    Generate Similar Missions
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/groups/${group.id}/missions/outings/new`}>
                    <CalendarPlus className="h-4 w-4" />
                    Create Outing
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/groups/${group.id}/missions/new`}>
                    <Plus className="h-4 w-4" />
                    Create Mission
                  </Link>
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Active missions" value={dashboard.activeMissionCount} />
          <StatCard label="Pending review" value={dashboard.pendingMissionCount} />
          <StatCard label="Recent outings" value={dashboard.recentOutings.length} />
        </div>

        {dashboard.canAdmin && dashboard.pendingMissionCount > 0 ? (
          <div className="rounded-lg border bg-card p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">AI review queue</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {dashboard.pendingMissionCount} missions waiting.
                </p>
              </div>
              <Button asChild>
                <Link href={`/groups/${group.id}/missions/review`}>Review</Link>
              </Button>
            </div>
          </div>
        ) : null}

        <section>
          <h2 className="mb-3 text-lg font-semibold">Recent outings</h2>
          {dashboard.recentOutings.length === 0 ? (
            <EmptyState
              title="No outings yet"
              message="Create an outing before assigning missions."
              action={
                dashboard.canAdmin
                  ? {
                      href: `/groups/${group.id}/missions/outings/new`,
                      label: "Create outing",
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {dashboard.recentOutings.map((outing) => (
                <MissionOutingCard key={outing.id} outing={outing} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Active deck</h2>
          {dashboard.activeMissions.length === 0 ? (
            <EmptyState
              title="No active missions"
              message="Add a few safe missions to build the deck."
              action={
                dashboard.canAdmin
                  ? {
                      href: `/groups/${group.id}/missions/new`,
                      label: "Create mission",
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {dashboard.activeMissions.map((mission) => (
                <MissionTemplateCard
                  key={mission.id}
                  mission={mission}
                  canAdmin={dashboard.canAdmin}
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
