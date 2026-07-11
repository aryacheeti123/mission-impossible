import Link from "next/link";
import { Flag, Plus, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GroupDetail } from "@/types/app";

export function GroupHeader({ group }: { group: GroupDetail }) {
  return (
    <div className="flex flex-col gap-4 border-b bg-card px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
            <Badge variant={group.role === "admin" ? "default" : "outline"}>
              {group.role}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {group.memberCount} members
            </span>
            <span>Invite {group.inviteCode}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/groups/${group.id}/missions`}>
              <Flag className="h-4 w-4" />
              Missions
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/leaderboard/${group.id}`}>
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/groups/${group.id}/new`}>
              <Plus className="h-4 w-4" />
              Prediction
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
