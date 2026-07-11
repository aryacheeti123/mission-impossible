"use client";

import { useActionState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  rejectMissionCompletion,
  verifyMissionCompletion,
} from "@/lib/actions/missions";

const initialState = { error: "", success: "" };

export function VerifyMissionButton({
  groupId,
  outingId,
  assignmentId,
}: {
  groupId: string;
  outingId: string;
  assignmentId: string;
}) {
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyMissionCompletion,
    initialState,
  );
  const [rejectState, rejectAction, rejecting] = useActionState(
    rejectMissionCompletion,
    initialState,
  );
  const message =
    verifyState.error ||
    verifyState.success ||
    rejectState.error ||
    rejectState.success;
  const isError = Boolean(verifyState.error || rejectState.error);

  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      <form action={verifyAction} className="space-y-3">
        <input type="hidden" name="groupId" value={groupId} />
        <input type="hidden" name="outingId" value={outingId} />
        <input type="hidden" name="assignmentId" value={assignmentId} />
        <Textarea
          name="verificationNote"
          maxLength={500}
          placeholder="Optional verification note"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={verifying}>
            <CheckCircle2 className="h-4 w-4" />
            {verifying ? "Verifying" : "Verify"}
          </Button>
          <Button
            formAction={rejectAction}
            type="submit"
            variant="outline"
            size="sm"
            disabled={rejecting}
          >
            <XCircle className="h-4 w-4" />
            {rejecting ? "Rejecting" : "Reject"}
          </Button>
        </div>
      </form>
      {message ? (
        <p
          className={
            isError
              ? "text-sm font-medium text-destructive"
              : "text-sm font-medium text-primary"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
