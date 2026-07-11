"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { createGroup } from "@/lib/actions/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { error: "", success: "" };

export function CreateGroupForm() {
  const [state, formAction, pending] = useActionState(
    createGroup,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Group name</Label>
        <Input id="name" name="name" minLength={2} maxLength={80} required />
      </div>
      {state.error ? (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        <Plus className="h-4 w-4" />
        {pending ? "Creating" : "Create group"}
      </Button>
    </form>
  );
}
