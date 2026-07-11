import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { MissionStatusBadge } from "@/components/MissionStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { MissionOutingView } from "@/types/app";

export function MissionOutingCard({ outing }: { outing: MissionOutingView }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{outing.title}</CardTitle>
          <MissionStatusBadge status={outing.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {outing.startsAt ? (
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {formatDateTime(outing.startsAt)}
          </span>
        ) : null}
        {outing.venueType ? (
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {outing.venueType}
          </span>
        ) : null}
        {outing.vibe ? <p>{outing.vibe}</p> : null}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/groups/${outing.groupId}/missions/outings/${outing.id}`}>
            Open outing
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
