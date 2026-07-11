import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Button } from "@/components/ui/button";
import { getGroupDetail } from "@/lib/actions/groups";
import { getGroupLeaderboard } from "@/lib/actions/leaderboard";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function LeaderboardPage({ params }: PageProps) {
  const { groupId } = await params;
  const group = await getGroupDetail(groupId);

  if (!group) {
    notFound();
  }

  const rows = await getGroupLeaderboard(groupId);

  return (
    <AppShell>
      <section className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/groups/${group.id}`}>
            <ArrowLeft className="h-4 w-4" />
            {group.name}
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="mt-2 text-muted-foreground">
            Points include the 100 point starting balance, stakes, and wins.
          </p>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            title="No leaderboard yet"
            message="Members appear here after joining the group."
          />
        ) : (
          <LeaderboardTable rows={rows} />
        )}
      </section>
    </AppShell>
  );
}
