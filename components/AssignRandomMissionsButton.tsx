"use client";

import { useActionState } from "react";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { assignRandomMissionsForOuting } from "@/lib/actions/missions";

const initialState = { error: "", success: "" };

export function AssignRandomMissionsButton({
  groupId,
  outingId,
  disabled = false,
}: {
  groupId: string;
  outingId: string;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    assignRandomMissionsForOuting,
    initialState,
  );

  return (
    <div className="space-y-2">
      <form action={formAction}>
        <input type="hidden" name="groupId" value={groupId} />
        <input type="hidden" name="outingId" value={outingId} />
        <Button type="submit" disabled={pending || disabled}>
          <Shuffle className="h-4 w-4" />
          {pending ? "Assigning" : "Assign Random Missions"}
        </Button>
      </form>
      {state.error ? (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm font-medium text-primary">{state.success}</p>
      ) : null}
    </div>
  );
}
