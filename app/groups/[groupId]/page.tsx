import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { GroupHeader } from "@/components/GroupHeader";
import { PredictionCard } from "@/components/PredictionCard";
import { getGroupDetail } from "@/lib/actions/groups";
import { getGroupPredictions } from "@/lib/actions/predictions";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupPage({ params }: PageProps) {
  const { groupId } = await params;
  const group = await getGroupDetail(groupId);

  if (!group) {
    notFound();
  }

  const predictions = await getGroupPredictions(groupId);
  const active = predictions.filter(
    (prediction) => prediction.effectiveStatus === "open",
  );
  const closed = predictions.filter(
    (prediction) => prediction.effectiveStatus === "closed",
  );
  const resolved = predictions.filter(
    (prediction) => prediction.effectiveStatus === "resolved",
  );

  return (
    <AppShell>
      <GroupHeader group={group} />
      <section className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {predictions.length === 0 ? (
          <EmptyState
            title="No predictions yet"
            message="Start the first Yes/No bet for this group."
            action={{
              href: `/groups/${group.id}/new`,
              label: "Create prediction",
            }}
          />
        ) : (
          <>
            <PredictionSection title="Open" predictions={active} />
            <PredictionSection title="Closed" predictions={closed} />
            <PredictionSection title="Resolved" predictions={resolved} />
          </>
        )}
      </section>
    </AppShell>
  );
}

function PredictionSection({
  title,
  predictions,
}: {
  title: string;
  predictions: Awaited<ReturnType<typeof getGroupPredictions>>;
}) {
  if (predictions.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {predictions.map((prediction) => (
          <PredictionCard key={prediction.id} prediction={prediction} />
        ))}
      </div>
    </div>
  );
}
