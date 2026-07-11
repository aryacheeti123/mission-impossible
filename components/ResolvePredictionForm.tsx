"use client";

import { useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { resolvePrediction } from "@/lib/actions/predictions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { PredictionOptionView } from "@/types/app";

const initialState = { error: "", success: "" };

export function ResolvePredictionForm({
  predictionId,
  options,
}: {
  predictionId: string;
  options: PredictionOptionView[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    resolvePrediction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="predictionId" value={predictionId} />
      <div className="space-y-2">
        <Label htmlFor="winningOptionId">Winning outcome</Label>
        <Select id="winningOptionId" name="winningOptionId" required>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      {state.error ? (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm font-medium text-primary">{state.success}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        <Trophy className="h-4 w-4" />
        {pending ? "Resolving" : "Resolve"}
      </Button>
    </form>
  );
}
