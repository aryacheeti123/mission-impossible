"use client";

import { useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { voteOnPrediction } from "@/lib/actions/predictions";
import { Button } from "@/components/ui/button";
import type { PredictionOptionView } from "@/types/app";
import type { PredictionStatus } from "@/types/database";

const initialState = { error: "", success: "" };

export function VoteButtons({
  predictionId,
  options,
  effectiveStatus,
  userVoteOptionId,
}: {
  predictionId: string;
  options: PredictionOptionView[];
  effectiveStatus: PredictionStatus;
  userVoteOptionId: string | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    voteOnPrediction,
    initialState,
  );
  const isOpen = effectiveStatus === "open";
  const hasVoted = Boolean(userVoteOptionId);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option.id === userVoteOptionId;
          const Icon = option.label.toLowerCase() === "yes" ? Check : X;

          return (
            <form action={formAction} key={option.id}>
              <input type="hidden" name="predictionId" value={predictionId} />
              <input type="hidden" name="optionId" value={option.id} />
              <Button
                type="submit"
                size="lg"
                variant={selected ? "default" : "outline"}
                className="h-16 w-full text-lg"
                disabled={!isOpen || hasVoted || pending}
              >
                <Icon className="h-5 w-5" />
                {option.label}
              </Button>
            </form>
          );
        })}
      </div>
      {state.error ? (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      ) : null}
      {hasVoted ? (
        <p className="text-sm font-medium text-primary">Your vote is locked.</p>
      ) : null}
      {!isOpen ? (
        <p className="text-sm font-medium text-muted-foreground">
          Voting is closed.
        </p>
      ) : null}
    </div>
  );
}
