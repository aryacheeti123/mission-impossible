import Link from "next/link";
import { CheckCircle2, Clock, UserRound } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { PredictionSummary } from "@/types/app";

export function PredictionCard({ prediction }: { prediction: PredictionSummary }) {
  const selected = prediction.options.find(
    (option) => option.id === prediction.userVoteOptionId,
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{prediction.title}</CardTitle>
          <StatusBadge status={prediction.effectiveStatus} />
        </div>
        {prediction.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {prediction.description}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {prediction.options.map((option) => (
            <div
              key={option.id}
              className="rounded-md border bg-muted/40 px-3 py-2"
            >
              <div className="text-xs font-medium text-muted-foreground">
                {option.label}
              </div>
              <div className="text-xl font-bold">{option.voteCount}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="h-4 w-4" />
            {prediction.creator?.displayName ?? "Unknown player"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {formatDateTime(prediction.closesAt)}
          </span>
          {selected ? (
            <span className="inline-flex items-center gap-1.5 text-primary">
              <CheckCircle2 className="h-4 w-4" />
              You voted {selected.label}
            </span>
          ) : null}
          {prediction.resolvedOutcome ? (
            <span className="font-medium text-foreground">
              Outcome: {prediction.resolvedOutcome}
            </span>
          ) : null}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/predictions/${prediction.id}`}>Open</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
