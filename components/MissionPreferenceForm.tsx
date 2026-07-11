"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateMissionPreferences } from "@/lib/actions/missions";
import type { MissionPreferenceView } from "@/types/app";

const initialState = { error: "", success: "" };

export function MissionPreferenceForm({
  groupId,
  preferences,
}: {
  groupId: string;
  preferences: MissionPreferenceView;
}) {
  const [state, formAction, pending] = useActionState(
    updateMissionPreferences,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="groupId" value={groupId} />
      <div className="grid gap-3">
        <PreferenceToggle
          name="allowPerformance"
          label="Performance missions"
          defaultChecked={preferences.allowPerformance}
        />
        <PreferenceToggle
          name="allowPhoto"
          label="Photo missions"
          defaultChecked={preferences.allowPhoto}
        />
        <PreferenceToggle
          name="allowTalkingToStrangers"
          label="Talking to strangers"
          defaultChecked={preferences.allowTalkingToStrangers}
        />
        <PreferenceToggle
          name="allowDancing"
          label="Dancing"
          defaultChecked={preferences.allowDancing}
        />
        <PreferenceToggle
          name="allowDrinkingRelated"
          label="Drinking-related missions"
          defaultChecked={preferences.allowDrinkingRelated}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxDifficulty">Max difficulty</Label>
        <Select
          id="maxDifficulty"
          name="maxDifficulty"
          defaultValue={preferences.maxDifficulty}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="chaotic_safe">Chaotic safe</option>
        </Select>
      </div>
      {state.error ? (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm font-medium text-primary">{state.success}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        <Save className="h-4 w-4" />
        {pending ? "Saving" : "Save preferences"}
      </Button>
    </form>
  );
}

function PreferenceToggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-md border bg-card px-4 py-3 text-sm font-medium">
      <span>{label}</span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-5 w-5 accent-primary"
      />
    </label>
  );
}
