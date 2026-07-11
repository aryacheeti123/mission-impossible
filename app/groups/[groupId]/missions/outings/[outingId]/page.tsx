import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AssignRandomMissionsButton } from "@/components/AssignRandomMissionsButton";
import { EmptyState } from "@/components/EmptyState";
import { MissionAssignmentCard } from "@/components/MissionAssignmentCard";
import { MissionStatusBadge } from "@/components/MissionStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMissionOutingDetail } from "@/lib/actions/missions";
import { formatDateTime } from "@/lib/utils";

type PageProps = {
  params: Promise<{ groupId: string; outingId: string }>;
};

export default async function MissionOutingPage({ params }: PageProps) {
  const { groupId, outingId } = await params;
  const detail = await getMissionOutingDetail(groupId, outingId);

  if (!detail) {
    notFound();
  }

  const canAssign =
    detail.canAdmin &&
    detail.assignmentCount === 0 &&
    detail.activeMissionCount > 0 &&
    detail.outing.status !== "completed" &&
    detail.outing.status !== "cancelled";

  return (
    <AppShell>
      <section className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/groups/${detail.outing.groupId}/missions`}>
            <ArrowLeft className="h-4 w-4" />
            Missions
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-2xl">{detail.outing.title}</CardTitle>
                <p className="mt-2 text-muted-foreground">{detail.groupName}</p>
              </div>
              <MissionStatusBadge status={detail.outing.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoTile label="Assignments" value={String(detail.assignmentCount)} />
              <InfoTile
                label="Active deck"
                value={String(detail.activeMissionCount)}
              />
              <InfoTile
                label="Status"
                value={detail.outing.status.replace("_", " ")}
              />
            </div>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {detail.outing.startsAt ? (
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {formatDateTime(detail.outing.startsAt)}
                </span>
              ) : null}
              {detail.outing.venueType ? (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {detail.outing.venueType}
                </span>
              ) : null}
              {detail.outing.vibe ? <span>{detail.outing.vibe}</span> : null}
            </div>
            {detail.canAdmin ? (
              <AssignRandomMissionsButton
                groupId={detail.outing.groupId}
                outingId={detail.outing.id}
                disabled={!canAssign}
              />
            ) : null}
          </CardContent>
        </Card>

        {!detail.canAdmin ? (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Your mission</h2>
            {detail.userAssignment ? (
              <MissionAssignmentCard assignment={detail.userAssignment} />
            ) : (
              <EmptyState
                title="No mission assigned"
                message="Once an admin assigns missions, yours will appear here."
              />
            )}
          </section>
        ) : null}

        {detail.verificationQueue.length > 0 ? (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Verification queue</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {detail.verificationQueue.map((assignment) => (
                <MissionAssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  showAssignee
                />
              ))}
            </div>
          </section>
        ) : null}

        {detail.canAdmin ? (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Assignments</h2>
            {detail.assignments.length === 0 ? (
              <EmptyState
                title="No assignments yet"
                message="Assign random missions when the outing is ready."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {detail.assignments.map((assignment) => (
                  <MissionAssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    showAssignee
                  />
                ))}
              </div>
            )}
          </section>
        ) : null}
      </section>
    </AppShell>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-semibold capitalize">{value}</div>
    </div>
  );
}
