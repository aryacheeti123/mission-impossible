"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateMissionTemplatesWithAI } from "@/lib/actions/missions";

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

export function MissionGenerateForm({ groupId }: { groupId: string }) {
  const [state, formAction, pending] = useActionState(
    generateMissionTemplatesWithAI,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="groupId" value={groupId} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="count">Count</Label>
          <Input
            id="count"
            name="count"
            type="number"
            min={1}
            max={20}
            defaultValue={8}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="venueType">Venue type</Label>
          <Input
            id="venueType"
            name="venueType"
            maxLength={80}
            placeholder="Bar, club, lounge"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vibe">Vibe</Label>
          <Input
            id="vibe"
            name="vibe"
            maxLength={120}
            placeholder="Funny, low pressure"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <fieldset className="space-y-3 rounded-md border p-4">
          <legend className="px-1 text-sm font-semibold">Categories</legend>
          <div className="grid gap-2">
            {categories.map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="categories"
                  value={value}
                  defaultChecked={value !== "wildcard"}
                  className="h-4 w-4 accent-primary"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-3 rounded-md border p-4">
          <legend className="px-1 text-sm font-semibold">Difficulty mix</legend>
          <div className="grid gap-2">
            {difficulties.map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="difficultyMix"
                  value={value}
                  defaultChecked={value === "easy" || value === "medium"}
                  className="h-4 w-4 accent-primary"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {state.error ? (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm font-medium text-primary">
          {state.success}{" "}
          <Link href={`/groups/${groupId}/missions/review`} className="underline">
            Review queue
          </Link>
        </p>
      ) : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        <Sparkles className="h-4 w-4" />
        {pending ? "Generating" : "Generate similar missions"}
      </Button>
    </form>
  );
}
