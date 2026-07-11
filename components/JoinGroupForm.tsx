"use client";

import { useActionState } from "react";
import { DoorOpen } from "lucide-react";
import { joinGroup } from "@/lib/actions/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { error: "", success: "" };

export function JoinGroupForm() {
  const [state, formAction, pending] = useActionState(joinGroup, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="inviteCode">Invite code</Label>
        <Input
          id="inviteCode"
          name="inviteCode"
          className="uppercase"
          minLength={4}
          maxLength={16}
          required
        />
      </div>
      {state.error ? (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        <DoorOpen className="h-4 w-4" />
        {pending ? "Joining" : "Join group"}
      </Button>
    </form>
  );
}
