import { Trophy } from "lucide-react";
import type { LeaderboardRow } from "@/types/app";

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="grid grid-cols-[56px_1fr_86px] gap-3 border-b bg-muted/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[72px_1fr_110px_120px_86px]">
        <div>Rank</div>
        <div>Player</div>
        <div className="text-right">Points</div>
        <div className="hidden text-right sm:block">Votes</div>
        <div className="hidden text-right sm:block">Wins</div>
      </div>
      {rows.map((row) => (
        <div
          key={row.userId}
          className="grid grid-cols-[56px_1fr_86px] items-center gap-3 border-b px-4 py-4 last:border-b-0 sm:grid-cols-[72px_1fr_110px_120px_86px]"
        >
          <div className="flex items-center gap-2 font-bold">
            {row.rank === 1 ? <Trophy className="h-4 w-4 text-accent" /> : null}
            {row.rank}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold">{row.displayName}</div>
            <div className="truncate text-sm text-muted-foreground">
              @{row.username}
            </div>
          </div>
          <div className="text-right text-lg font-bold">{row.points}</div>
          <div className="hidden text-right text-sm text-muted-foreground sm:block">
            {row.predictionsVoted}
          </div>
          <div className="hidden text-right text-sm text-muted-foreground sm:block">
            {row.wins}
          </div>
        </div>
      ))}
    </div>
  );
}
