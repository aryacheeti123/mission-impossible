import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ResolvePredictionForm } from "@/components/ResolvePredictionForm";
import { StatusBadge } from "@/components/StatusBadge";
import { VoteButtons } from "@/components/VoteButtons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPredictionDetail } from "@/lib/actions/predictions";
import { formatDateTime } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PredictionPage({ params }: PageProps) {
  const { id } = await params;
  const prediction = await getPredictionDetail(id);

  if (!prediction) {
    notFound();
  }

  return (
    <AppShell>
      <section className="mx-auto w-full max-w-4xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/groups/${prediction.groupId}`}>
            <ArrowLeft className="h-4 w-4" />
            {prediction.groupName}
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-2xl">{prediction.title}</CardTitle>
                {prediction.description ? (
                  <p className="mt-3 text-muted-foreground">
                    {prediction.description}
                  </p>
                ) : null}
              </div>
              <StatusBadge status={prediction.effectiveStatus} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoTile
                icon={<UserRound className="h-4 w-4" />}
                label="Creator"
                value={prediction.creator?.displayName ?? "Unknown player"}
              />
              <InfoTile
                icon={<Clock className="h-4 w-4" />}
                label="Closes"
                value={formatDateTime(prediction.closesAt)}
              />
              <InfoTile label="Votes" value={String(prediction.totalVotes)} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {prediction.options.map((option) => (
                <div key={option.id} className="rounded-lg border bg-muted/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{option.label}</span>
                    <span className="text-2xl font-bold">{option.voteCount}</span>
                  </div>
                </div>
              ))}
            </div>

            {prediction.resolvedOutcome ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800">
                Outcome: {prediction.resolvedOutcome}
              </div>
            ) : (
              <VoteButtons
                predictionId={prediction.id}
                options={prediction.options}
                effectiveStatus={prediction.effectiveStatus}
                userVoteOptionId={prediction.userVoteOptionId}
              />
            )}
          </CardContent>
        </Card>

        {prediction.canResolve ? (
          <Card>
            <CardHeader>
              <CardTitle>Resolve prediction</CardTitle>
            </CardHeader>
            <CardContent>
              <ResolvePredictionForm
                predictionId={prediction.id}
                options={prediction.options}
              />
            </CardContent>
          </Card>
        ) : null}
      </section>
    </AppShell>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-semibold">{value}</div>
    </div>
  );
}
