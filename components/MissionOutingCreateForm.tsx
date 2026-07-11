"use client";

import { useActionState } from "react";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMissionOuting } from "@/lib/actions/missions";

const initialState = { error: "", success: "" };

export function MissionOutingCreateForm({ groupId }: { groupId: string }) {
  const [state, formAction, pending] = useActionState(
    createMissionOuting,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="groupId" value={groupId} />
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          minLength={3}
          maxLength={120}
          placeholder="Brickell Friday Night"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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
          <Label htmlFor="startsAt">Starts at</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="vibe">Vibe</Label>
        <Input
          id="vibe"
          name="vibe"
          maxLength={120}
          placeholder="Casual, chaotic safe, birthday energy"
        />
      </div>
      {state.error ? (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        <CalendarPlus className="h-4 w-4" />
        {pending ? "Creating" : "Create outing"}
      </Button>
    </form>
  );
}
