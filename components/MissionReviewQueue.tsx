"use client";

import { useActionState } from "react";
import { Check, Save, X } from "lucide-react";
import { MissionCategoryBadge } from "@/components/MissionCategoryBadge";
import { MissionDifficultyBadge } from "@/components/MissionDifficultyBadge";
import { MissionStatusBadge } from "@/components/MissionStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  approveMissionTemplate,
  rejectMissionTemplate,
  updateMissionTemplate,
} from "@/lib/actions/missions";
import type { MissionTemplateView } from "@/types/app";

const initialState = { error: "", success: "" };

const categories = [
  ["social", "Social"],
  ["observation", "Observation"],
  ["photo", "Photo"],
  ["performance", "Performance"],
  ["team", "Team"],
  ["low_key", "Low key"],
  ["wildcard", "Wildcard"],
] as const;

const difficulties = [
  ["easy", "Easy"],
  ["medium", "Medium"],
  ["hard", "Hard"],
  ["chaotic_safe", "Chaotic safe"],
] as const;

export function MissionReviewQueue({
  missions,
}: {
  missions: MissionTemplateView[];
}) {
  if (missions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-card px-6 py-10 text-center">
        <h2 className="text-lg font-semibold">Review queue is clear</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Generated missions will appear here before they can be assigned.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {missions.map((mission) => (
        <MissionReviewItem key={mission.id} mission={mission} />
      ))}
    </div>
  );
}

function MissionReviewItem({ mission }: { mission: MissionTemplateView }) {
  const [updateState, updateAction, updating] = useActionState(
    updateMissionTemplate,
    initialState,
  );
  const [approveState, approveAction, approving] = useActionState(
    approveMissionTemplate,
    initialState,
  );
  const [rejectState, rejectAction, rejecting] = useActionState(
    rejectMissionTemplate,
    initialState,
  );
  const message =
    updateState.error ||
    updateState.success ||
    approveState.error ||
    approveState.success ||
    rejectState.error ||
    rejectState.success;
  const isError =
    Boolean(updateState.error) ||
    Boolean(approveState.error) ||
    Boolean(rejectState.error);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">{mission.title}</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              <MissionCategoryBadge category={mission.category} />
              <MissionDifficultyBadge difficulty={mission.difficulty} />
              <MissionStatusBadge status={mission.status} />
            </div>
          </div>
          <MissionStatusBadge status={mission.source} />
        </div>
      </CardHeader>
      <CardContent>
        <form action={updateAction} className="space-y-4">
          <input type="hidden" name="groupId" value={mission.groupId} />
          <input type="hidden" name="templateId" value={mission.id} />
          <input type="hidden" name="status" value={mission.status} />
          <div className="space-y-2">
            <Label htmlFor={`review-title-${mission.id}`}>Title</Label>
            <Input
              id={`review-title-${mission.id}`}
              name="title"
              defaultValue={mission.title}
              minLength={3}
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`review-description-${mission.id}`}>Description</Label>
            <Textarea
              id={`review-description-${mission.id}`}
              name="description"
              defaultValue={mission.description ?? ""}
              maxLength={600}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`review-category-${mission.id}`}>Category</Label>
              <Select
                id={`review-category-${mission.id}`}
                name="category"
                defaultValue={mission.category}
              >
                {categories.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`review-difficulty-${mission.id}`}>Difficulty</Label>
              <Select
                id={`review-difficulty-${mission.id}`}
                name="difficulty"
                defaultValue={mission.difficulty}
              >
                {difficulties.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`review-safety-${mission.id}`}>Safety notes</Label>
            <Textarea
              id={`review-safety-${mission.id}`}
              name="safetyNotes"
              defaultValue={mission.safetyNotes ?? ""}
              maxLength={600}
            />
          </div>
          <Button type="submit" variant="outline" disabled={updating}>
            <Save className="h-4 w-4" />
            {updating ? "Saving" : "Save edits"}
          </Button>
        </form>
        {message ? (
          <p
            className={
              isError
                ? "mt-4 text-sm font-medium text-destructive"
                : "mt-4 text-sm font-medium text-primary"
            }
          >
            {message}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex-wrap">
        <form action={approveAction}>
          <input type="hidden" name="groupId" value={mission.groupId} />
          <input type="hidden" name="templateId" value={mission.id} />
          <Button type="submit" size="sm" disabled={approving}>
            <Check className="h-4 w-4" />
            Approve
          </Button>
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="groupId" value={mission.groupId} />
          <input type="hidden" name="templateId" value={mission.id} />
          <Button type="submit" variant="destructive" size="sm" disabled={rejecting}>
            <X className="h-4 w-4" />
            Reject
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
