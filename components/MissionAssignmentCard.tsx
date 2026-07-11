"use client";

import { useActionState } from "react";
import { CheckCircle2, CircleSlash } from "lucide-react";
import { MissionCategoryBadge } from "@/components/MissionCategoryBadge";
import { MissionDifficultyBadge } from "@/components/MissionDifficultyBadge";
import { MissionStatusBadge } from "@/components/MissionStatusBadge";
import { VerifyMissionButton } from "@/components/VerifyMissionButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  markMissionCompleted,
  skipMissionAssignment,
} from "@/lib/actions/missions";
import { formatDateTime } from "@/lib/utils";
import type { MissionAssignmentView } from "@/types/app";

const initialState = { error: "", success: "" };

export function MissionAssignmentCard({
  assignment,
  showAssignee = false,
}: {
  assignment: MissionAssignmentView;
  showAssignee?: boolean;
}) {
  const [completeState, completeAction, completing] = useActionState(
    markMissionCompleted,
    initialState,
  );
  const [skipState, skipAction, skipping] = useActionState(
    skipMissionAssignment,
    initialState,
  );
  const mission = assignment.mission;
  const canAct =
    assignment.isOwnAssignment &&
    (assignment.status === "assigned" || assignment.status === "rejected");
  const message =
    completeState.error ||
    completeState.success ||
    skipState.error ||
    skipState.success;
  const isError = Boolean(completeState.error || skipState.error);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              {mission?.title ?? "Mission unavailable"}
            </CardTitle>
            {showAssignee ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {assignment.assignee?.displayName ?? "Unknown player"}
              </p>
            ) : null}
          </div>
          <MissionStatusBadge status={assignment.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mission ? (
          <>
            <div className="flex flex-wrap gap-2">
              <MissionCategoryBadge category={mission.category} />
              <MissionDifficultyBadge difficulty={mission.difficulty} />
              <span className="rounded-md border px-2.5 py-1 text-xs font-semibold">
                +{assignment.rewardPoints} pts
              </span>
            </div>
            {mission.description ? (
              <p className="text-sm text-muted-foreground">
                {mission.description}
              </p>
            ) : null}
            {mission.safetyNotes ? (
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <span className="font-semibold">Safety: </span>
                <span className="text-muted-foreground">
                  {mission.safetyNotes}
                </span>
              </div>
            ) : null}
          </>
        ) : null}
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Assigned {formatDateTime(assignment.assignedAt)}</p>
          {assignment.completedAt ? (
            <p>Completed {formatDateTime(assignment.completedAt)}</p>
          ) : null}
          {assignment.verifier ? <p>Verified by {assignment.verifier.displayName}</p> : null}
          {assignment.verificationNote ? <p>{assignment.verificationNote}</p> : null}
        </div>
        {assignment.canVerify ? (
          <VerifyMissionButton
            groupId={assignment.groupId}
            outingId={assignment.outingId}
            assignmentId={assignment.id}
          />
        ) : null}
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
      </CardContent>
      {canAct ? (
        <CardFooter className="flex-wrap">
          <form action={completeAction}>
            <input type="hidden" name="groupId" value={assignment.groupId} />
            <input type="hidden" name="outingId" value={assignment.outingId} />
            <input type="hidden" name="assignmentId" value={assignment.id} />
            <Button type="submit" size="sm" disabled={completing}>
              <CheckCircle2 className="h-4 w-4" />
              {completing ? "Completing" : "Mark Complete"}
            </Button>
          </form>
          <form action={skipAction}>
            <input type="hidden" name="groupId" value={assignment.groupId} />
            <input type="hidden" name="outingId" value={assignment.outingId} />
            <input type="hidden" name="assignmentId" value={assignment.id} />
            <Button type="submit" variant="outline" size="sm" disabled={skipping}>
              <CircleSlash className="h-4 w-4" />
              {skipping ? "Skipping" : "Skip"}
            </Button>
          </form>
        </CardFooter>
      ) : null}
    </Card>
  );
}
