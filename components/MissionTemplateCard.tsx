"use client";

import { useActionState } from "react";
import { Archive, Save, Trash2 } from "lucide-react";
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
  archiveMissionTemplate,
  deleteMissionTemplate,
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

export function MissionTemplateCard({
  mission,
  canAdmin = false,
}: {
  mission: MissionTemplateView;
  canAdmin?: boolean;
}) {
  const [updateState, updateAction, updating] = useActionState(
    updateMissionTemplate,
    initialState,
  );
  const [archiveState, archiveAction, archiving] = useActionState(
    archiveMissionTemplate,
    initialState,
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteMissionTemplate,
    initialState,
  );
  const message =
    updateState.error ||
    updateState.success ||
    archiveState.error ||
    archiveState.success ||
    deleteState.error ||
    deleteState.success;
  const isError =
    Boolean(updateState.error) ||
    Boolean(archiveState.error) ||
    Boolean(deleteState.error);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{mission.title}</CardTitle>
          <MissionStatusBadge status={mission.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <MissionCategoryBadge category={mission.category} />
          <MissionDifficultyBadge difficulty={mission.difficulty} />
          <MissionStatusBadge status={mission.source} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mission.description ? (
          <p className="text-sm text-muted-foreground">{mission.description}</p>
        ) : null}
        {canAdmin && mission.safetyNotes ? (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <span className="font-semibold">Safety: </span>
            <span className="text-muted-foreground">{mission.safetyNotes}</span>
          </div>
        ) : null}
        {canAdmin ? (
          <details className="rounded-md border bg-card p-3">
            <summary className="cursor-pointer text-sm font-semibold">Edit</summary>
            <form action={updateAction} className="mt-4 space-y-4">
              <input type="hidden" name="groupId" value={mission.groupId} />
              <input type="hidden" name="templateId" value={mission.id} />
              <input type="hidden" name="status" value={mission.status} />
              <div className="space-y-2">
                <Label htmlFor={`title-${mission.id}`}>Title</Label>
                <Input
                  id={`title-${mission.id}`}
                  name="title"
                  defaultValue={mission.title}
                  minLength={3}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`description-${mission.id}`}>Description</Label>
                <Textarea
                  id={`description-${mission.id}`}
                  name="description"
                  defaultValue={mission.description ?? ""}
                  maxLength={600}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`category-${mission.id}`}>Category</Label>
                  <Select
                    id={`category-${mission.id}`}
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
                  <Label htmlFor={`difficulty-${mission.id}`}>Difficulty</Label>
                  <Select
                    id={`difficulty-${mission.id}`}
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
                <Label htmlFor={`safety-${mission.id}`}>Safety notes</Label>
                <Textarea
                  id={`safety-${mission.id}`}
                  name="safetyNotes"
                  defaultValue={mission.safetyNotes ?? ""}
                  maxLength={600}
                />
              </div>
              <Button type="submit" disabled={updating}>
                <Save className="h-4 w-4" />
                {updating ? "Saving" : "Save"}
              </Button>
            </form>
          </details>
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
      {canAdmin ? (
        <CardFooter className="flex-wrap">
          {mission.status !== "archived" ? (
            <form action={archiveAction}>
              <input type="hidden" name="groupId" value={mission.groupId} />
              <input type="hidden" name="templateId" value={mission.id} />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={archiving}
              >
                <Archive className="h-4 w-4" />
                Archive
              </Button>
            </form>
          ) : null}
          <form action={deleteAction}>
            <input type="hidden" name="groupId" value={mission.groupId} />
            <input type="hidden" name="templateId" value={mission.id} />
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </form>
        </CardFooter>
      ) : null}
    </Card>
  );
}
