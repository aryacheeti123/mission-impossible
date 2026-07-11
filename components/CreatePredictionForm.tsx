"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { createPrediction } from "@/lib/actions/predictions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState = { error: "", success: "" };

function minDateTimeLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  now.setSeconds(0, 0);
  return now.toISOString().slice(0, 16);
}

export function CreatePredictionForm({ groupId }: { groupId: string }) {
  const [state, formAction, pending] = useActionState(
    createPrediction,
    initialState,
  );
  const minClose = minDateTimeLocal();

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="groupId" value={groupId} />
      <div className="space-y-2">
        <Label htmlFor="title">Question</Label>
        <Input
          id="title"
          name="title"
          minLength={5}
          maxLength={140}
          placeholder="Will Arya do a backflip tonight?"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          maxLength={600}
          placeholder="Add context, rules, or the exact thing that counts."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="closesAt">Closes at</Label>
        <Input
          id="closesAt"
          name="closesAt"
          type="datetime-local"
          min={minClose}
          required
        />
      </div>
      {state.error ? (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        <Send className="h-4 w-4" />
        {pending ? "Creating" : "Create prediction"}
      </Button>
    </form>
  );
}
