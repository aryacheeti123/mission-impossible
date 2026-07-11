"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createMissionTemplate } from "@/lib/actions/missions";

const initialState = { error: "", success: "" };

export function MissionCreateForm({ groupId }: { groupId: string }) {
  const [state, formAction, pending] = useActionState(
    createMissionTemplate,
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
          placeholder="Fake award speech"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          maxLength={600}
          placeholder="Give a 20-second fake award speech about someone in the group."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select id="category" name="category" defaultValue="social">
            <option value="social">Social</option>
            <option value="observation">Observation</option>
            <option value="photo">Photo</option>
            <option value="performance">Performance</option>
            <option value="team">Team</option>
            <option value="low_key">Low key</option>
            <option value="wildcard">Wildcard</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select id="difficulty" name="difficulty" defaultValue="easy">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="chaotic_safe">Chaotic safe</option>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="safetyNotes">Safety notes</Label>
        <Textarea
          id="safetyNotes"
          name="safetyNotes"
          maxLength={600}
          placeholder="Keep it inside the friend group and do not film strangers."
        />
      </div>
      {state.error ? (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        <Send className="h-4 w-4" />
        {pending ? "Creating" : "Create mission"}
      </Button>
    </form>
  );
}
